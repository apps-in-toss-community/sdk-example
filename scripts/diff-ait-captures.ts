#!/usr/bin/env node
// diff-ait-captures.ts — 두 capture 세트(디렉토리) 사이의 동치 계측 스크립트.
//
// Usage:
//   pnpm diff:captures --a <dir> --b <dir>          # 사람이 읽는 요약 + 불일치 목록
//   pnpm diff:captures --a <dir> --b <dir> --json   # 기계 판독 JSON만 stdout
//
// 각 디렉토리에서 `<category>.<sdkLine>.<platform>.json` 패턴 파일(예:
// `ads.2.x.mock.json`)을 전부 읽는다 — 파일 각각은 `AitCaptureRecord`
// 배열(src/test/aitCapture.ts)이다. 비교 키는 `(api, scenario)`; 같은 키가
// 한 세트에 여럿이면(재시도 등) 마지막 record를 채택한다.
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

interface KeyMismatch {
  key: string;
  fields: FieldMismatch[];
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

/** 비교 키 `(api, scenario)` — 같은 키가 여럿이면 마지막 record가 채택된다(재시도 덮어쓰기 semantics). */
function indexByKey(records: CaptureRecord[]): Map<string, CaptureRecord> {
  const map = new Map<string, CaptureRecord>();
  for (const r of records) {
    map.set(`${r.api} ${r.scenario}`, r);
  }
  return map;
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
  const mapA = indexByKey(recordsA);
  const mapB = indexByKey(recordsB);

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
    const fields = compareRecords(a, b);
    if (fields.length === 0) {
      equivalentCount++;
    } else {
      mismatches.push({ key, fields });
    }
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
      for (const f of m.fields) {
        console.log(`      ${f.field}: A=${JSON.stringify(f.a)}  B=${JSON.stringify(f.b)}`);
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
export { compareRecords, diff, indexByKey, loadCaptureDir };

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
