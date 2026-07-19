#!/usr/bin/env node
// diff-ait-captures.ts — 두 capture 세트(디렉토리) 사이의 동치 계측 스크립트.
//
// Usage:
//   pnpm diff:captures --a <dir> --b <dir>          # 사람이 읽는 요약 + 불일치 목록
//   pnpm diff:captures --a <dir> --b <dir> --json   # 기계 판독 JSON만 stdout
//
// 각 디렉토리에서 `<category>.<sdkLine>.<platform>.json` 패턴 파일(예:
// `ads.2.x.mock.json`)을 전부 읽는다 — 파일 각각은 `AitCaptureRecord`
// 배열(src/test/aitCapture.ts)이다. 비교 키는 `(api, scenario)`; 같은 키에 record가
// 여럿이면(값 union을 순회하는 반복 시나리오) 전부 모아 shape 멀티셋으로 대조한다 —
// 마지막 하나만 채택하면 나머지 관측이 조용히 사라져 거짓 동치가 생긴다(#308).
//
// 이 스크립트는 계측 도구지 CI 게이트가 아니다 — exit code는 항상 0.
//
// 커뮤니티 오픈소스 프로젝트입니다.

import { readdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

/** src/test/aitCapture.ts의 AitCaptureRecord와 동일 shape — 여기선 필요한 필드만 선언. */
export interface CaptureRecord {
  category: string;
  api: string;
  scenario: string;
  outcome?: unknown;
  errorName?: unknown;
  errorCode?: unknown;
  returnType?: unknown;
  valueKeys?: unknown;
  sdkLine?: unknown;
  platform?: unknown;
  [key: string]: unknown;
}

/** 비교 대상 필드 — valueKeys는 양쪽 다 존재할 때만 비교(아래 compareRecords 참조). */
const COMPARE_FIELDS = ['outcome', 'errorName', 'errorCode', 'returnType'] as const;
type CompareField = (typeof COMPARE_FIELDS)[number] | 'valueKeys';

interface FieldMismatch {
  field: CompareField;
  a: unknown;
  b: unknown;
}

/** 멀티셋의 한 원소 — `shape`는 `shapeOf`가 만든 정규 문자열. */
interface ShapeCount {
  shape: string;
  count: number;
}

interface KeyMismatch {
  key: string;
  /**
   * 필드별 상세 — 양쪽 다 shape가 **한 종류뿐**일 때만 채워진다(대부분의 키).
   * 반복 시나리오처럼 한쪽이라도 여러 shape를 관측했으면 필드 단위로 짝지을
   * 대상이 없으므로 비우고 아래 멀티셋으로 보고한다.
   */
  fields: FieldMismatch[];
  /** 이 키에서 각 세트가 관측한 shape 멀티셋. */
  shapesA: ShapeCount[];
  shapesB: ShapeCount[];
}

interface DiffResult {
  totalKeys: number;
  equivalentCount: number;
  mismatches: KeyMismatch[];
  onlyInA: string[];
  onlyInB: string[];
}

/** `<category>.<sdkLine>.<platform>.json` — 파일명 패턴 자체는 무관하게 취급하고 내용만 읽는다. */
const CAPTURE_FILE_RE = /\.json$/;

function parseArgs(argv: string[]): { a: string; b: string; json: boolean } {
  let a: string | undefined;
  let b: string | undefined;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--a') {
      a = argv[++i];
    } else if (arg === '--b') {
      b = argv[++i];
    } else if (arg === '--json') {
      json = true;
    }
  }

  if (!a || !b) {
    console.error('Usage: pnpm diff:captures --a <dir> --b <dir> [--json]');
    process.exit(1);
  }

  return { a, b, json };
}

/** 디렉토리에서 `*.json` capture 파일을 전부 읽어 record 배열로 합친다. */
function loadCaptureDir(dir: string): CaptureRecord[] {
  const absDir = resolve(dir);
  let entries: string[];
  try {
    entries = readdirSync(absDir);
  } catch {
    console.error(`Warning: capture 디렉토리를 읽을 수 없습니다 — ${absDir} (빈 세트로 취급)`);
    return [];
  }

  const records: CaptureRecord[] = [];
  for (const entry of entries) {
    if (extname(entry) !== '.json' || !CAPTURE_FILE_RE.test(entry)) {
      continue;
    }
    const filePath = resolve(absDir, entry);
    let raw: string;
    try {
      raw = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error(`Warning: ${filePath} — JSON 파싱 실패, 건너뜀`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      console.error(`Warning: ${filePath} — record 배열이 아님, 건너뜀`);
      continue;
    }
    for (const item of parsed) {
      if (item !== null && typeof item === 'object' && 'api' in item && 'scenario' in item) {
        records.push(item as CaptureRecord);
      }
    }
  }
  return records;
}

/**
 * 비교 키 `(api, scenario)`로 record를 **모은다** — 덮어쓰지 않는다.
 *
 * 예전에는 같은 키의 record를 `map.set`으로 덮어써 마지막 하나만 남겼다("재시도
 * 덮어쓰기"). 그런데 슈트에는 재시도가 아니라 **union을 순회하는 반복 시나리오**가
 * 많다 — `getPermission :: happy-each-name`은 권한 6종을 돌아 record 6건을 같은
 * 키에 쌓는다. 덮어쓰면 그중 5건이 조용히 사라지고, 지표가 반복 순서에 좌우된다.
 * 실측(run11 2.x/iOS)에서 서로 다른 shape를 감춘 키가 3개 있었고 그중 하나는
 * **거짓 동치**였다(#308). 그래서 전부 모아 아래 멀티셋으로 대조한다.
 *
 * 재시도가 카운트를 부풀리지 않는가: THROTTLED backoff 재시도는 별도 record가
 * 아니라 한 record의 `throttleRetries` 카운터로 접힌다(`aitCapture.ts`). 따라서
 * record 수는 "실제 관측 횟수"와 일치한다.
 */
function groupByKey(records: CaptureRecord[]): Map<string, CaptureRecord[]> {
  const map = new Map<string, CaptureRecord[]>();
  for (const r of records) {
    const key = `${r.api} ${r.scenario}`;
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(r);
    } else {
      map.set(key, [r]);
    }
  }
  return map;
}

/**
 * 한 record의 비교 대상 shape를 정규 문자열로 인코딩한다 — 멀티셋의 원소.
 *
 * `valueKeys`는 순서를 계약으로 보지 않으므로 정렬한다. `includeValueKeys=false`면
 * 서명에서 아예 뺀다 — "양쪽 다 존재할 때만 비교한다"는 계약을 키 단위로 지키기
 * 위해서다(`shapeMultiset` 참조).
 */
function shapeOf(r: CaptureRecord, includeValueKeys: boolean): string {
  const base = [r.outcome ?? null, r.errorName ?? null, r.errorCode ?? null, r.returnType ?? null];
  if (!includeValueKeys) {
    return JSON.stringify(base);
  }
  const valueKeys = Array.isArray(r.valueKeys) ? [...r.valueKeys].sort() : (r.valueKeys ?? null);
  return JSON.stringify([...base, valueKeys]);
}

/** record가 비교 가능한 valueKeys를 갖고 있는가. */
function hasValueKeys(r: CaptureRecord): boolean {
  return r.valueKeys != null;
}

/**
 * shape → 관측 횟수. 키 하나의 멀티셋.
 *
 * `valueKeys`는 **양쪽 버킷의 모든 record가 갖고 있을 때만** 서명에 넣는다.
 * 단일 record 시절의 "양쪽 다 있을 때만 비교" 계약을 버킷으로 일반화한 것 —
 * 한쪽이라도 null이면(reject·非object 반환, 또는 valueKeys 이전 버전 캡처) 그
 * 키에서는 valueKeys를 비교 대상에서 뺀다. 다른 필드가 이미 갈렸다면 그쪽에서
 * 잡히므로 판별력 손실은 없다.
 */
function shapeMultiset(records: CaptureRecord[], includeValueKeys: boolean): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of records) {
    const s = shapeOf(r, includeValueKeys);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return counts;
}

function multisetsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [shape, count] of a) {
    if (b.get(shape) !== count) return false;
  }
  return true;
}

/** 멀티셋을 사람이 읽는 목록으로 — 관측 많은 shape 먼저. */
function describeMultiset(counts: Map<string, number>): ShapeCount[] {
  return [...counts.entries()]
    .map(([shape, count]) => ({ shape, count }))
    .sort((x, y) => y.count - x.count || x.shape.localeCompare(y.shape));
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }
  return a === b;
}

/** 두 record 사이 필드별 mismatch를 계산한다. valueKeys는 양쪽 다 있을 때만 비교. */
function compareRecords(a: CaptureRecord, b: CaptureRecord): FieldMismatch[] {
  const mismatches: FieldMismatch[] = [];
  for (const field of COMPARE_FIELDS) {
    if (!valuesEqual(a[field], b[field])) {
      mismatches.push({ field, a: a[field], b: b[field] });
    }
  }
  if (a.valueKeys != null && b.valueKeys != null) {
    if (!valuesEqual(a.valueKeys, b.valueKeys)) {
      mismatches.push({ field: 'valueKeys', a: a.valueKeys, b: b.valueKeys });
    }
  }
  return mismatches;
}

function diff(recordsA: CaptureRecord[], recordsB: CaptureRecord[]): DiffResult {
  const mapA = groupByKey(recordsA);
  const mapB = groupByKey(recordsB);

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const mismatches: KeyMismatch[] = [];
  let equivalentCount = 0;

  const allKeys = new Set<string>([...mapA.keys(), ...mapB.keys()]);
  let totalKeys = 0;

  for (const key of allKeys) {
    const a = mapA.get(key);
    const b = mapB.get(key);
    if (a && !b) {
      onlyInA.push(key);
      continue;
    }
    if (!a && b) {
      onlyInB.push(key);
      continue;
    }
    if (!a || !b) {
      continue;
    }
    totalKeys++;
    const includeValueKeys = a.every(hasValueKeys) && b.every(hasValueKeys);
    const countsA = shapeMultiset(a, includeValueKeys);
    const countsB = shapeMultiset(b, includeValueKeys);
    if (multisetsEqual(countsA, countsB)) {
      equivalentCount++;
      continue;
    }
    // 양쪽 다 단일 shape면 필드별 상세가 읽기 좋다 — 그때만 채운다.
    const first = (bucket: CaptureRecord[]) => bucket[0] as CaptureRecord;
    const fields =
      countsA.size === 1 && countsB.size === 1 ? compareRecords(first(a), first(b)) : [];
    mismatches.push({
      key,
      fields,
      shapesA: describeMultiset(countsA),
      shapesB: describeMultiset(countsB),
    });
  }

  mismatches.sort((x, y) => x.key.localeCompare(y.key));
  onlyInA.sort();
  onlyInB.sort();

  return { totalKeys, equivalentCount, mismatches, onlyInA, onlyInB };
}

function keyLabel(key: string): string {
  const [api, scenario] = key.split(' ');
  return `${api} :: ${scenario}`;
}

function printHuman(result: DiffResult, aDir: string, bDir: string): void {
  const { totalKeys, equivalentCount, mismatches, onlyInA, onlyInB } = result;

  console.log(`capture diff — A: ${aDir}  B: ${bDir}`);
  console.log('');
  console.log(
    `동치 ${equivalentCount}/${totalKeys}  |  불일치 ${mismatches.length}  |  커버리지 갭: A에만 ${onlyInA.length}, B에만 ${onlyInB.length}`,
  );

  if (mismatches.length > 0) {
    console.log('');
    console.log('불일치 목록:');
    for (const m of mismatches) {
      console.log(`  - ${keyLabel(m.key)}`);
      if (m.fields.length > 0) {
        for (const f of m.fields) {
          console.log(`      ${f.field}: A=${JSON.stringify(f.a)}  B=${JSON.stringify(f.b)}`);
        }
        continue;
      }
      // 한쪽이라도 여러 shape를 관측했거나(반복 시나리오), shape는 같은데 관측
      // 횟수가 갈린 경우 — 멀티셋을 그대로 보여준다.
      console.log(`      A (${m.shapesA.reduce((n, s) => n + s.count, 0)}회 관측):`);
      for (const s of m.shapesA) {
        console.log(`        x${s.count} ${s.shape}`);
      }
      console.log(`      B (${m.shapesB.reduce((n, s) => n + s.count, 0)}회 관측):`);
      for (const s of m.shapesB) {
        console.log(`        x${s.count} ${s.shape}`);
      }
    }
  }

  if (onlyInA.length > 0) {
    console.log('');
    console.log('A에만 있는 키:');
    for (const key of onlyInA) {
      console.log(`  - ${keyLabel(key)}`);
    }
  }

  if (onlyInB.length > 0) {
    console.log('');
    console.log('B에만 있는 키:');
    for (const key of onlyInB) {
      console.log(`  - ${keyLabel(key)}`);
    }
  }
}

function toJson(result: DiffResult): unknown {
  return {
    equivalentCount: result.equivalentCount,
    totalKeys: result.totalKeys,
    mismatches: result.mismatches.map((m) => ({
      api: m.key.split(' ')[0],
      scenario: m.key.split(' ')[1],
      fields: m.fields,
      shapesA: m.shapesA,
      shapesB: m.shapesB,
    })),
    coverageGap: {
      onlyInA: result.onlyInA.map((key) => ({
        api: key.split(' ')[0],
        scenario: key.split(' ')[1],
      })),
      onlyInB: result.onlyInB.map((key) => ({
        api: key.split(' ')[0],
        scenario: key.split(' ')[1],
      })),
    },
  };
}

export function runDiff(aDir: string, bDir: string): DiffResult {
  const recordsA = loadCaptureDir(aDir);
  const recordsB = loadCaptureDir(bDir);
  return diff(recordsA, recordsB);
}

function main(): void {
  const { a, b, json } = parseArgs(process.argv.slice(2));
  const result = runDiff(a, b);

  if (json) {
    console.log(JSON.stringify(toJson(result), null, 2));
  } else {
    printHuman(result, a, b);
  }

  // 계측 도구지 게이트가 아니다 — 불일치/커버리지 갭이 있어도 exit 0.
  process.exit(0);
}

// 단위 테스트에서 diff()/compareRecords() 로직만 import할 수 있도록 named export로도 노출.
export { compareRecords, diff, groupByKey, loadCaptureDir, shapeMultiset, shapeOf };

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
