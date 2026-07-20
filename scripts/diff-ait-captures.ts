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
  /** Object.keys(err) — errorName/errorCode가 같아도 오류 shape 발산을 드러낸다. */
  errorKeys?: unknown;
  /** 네이티브 브리지 오류 지문(#329 item 4) — mock synthetic 오류 vs 실 브리지 오류를 가른다. */
  isNativeShape?: unknown;
  /** rejected 경로: 동기 throw(true) vs 비동기 reject(false)(#329 item 1). 그 외 경로엔 없음. */
  threwSync?: unknown;
  /** 배열 반환의 shape 요약 `{ length, elementType, elementKeys }`(#329 item 3). 배열일 때만. */
  arrayShape?: unknown;
  /** 기기 불변 enum getter의 실제 값(#329 item 2). allowlist API에만 존재. */
  enumValue?: unknown;
  sdkLine?: unknown;
  platform?: unknown;
  /** 붙어 있으면 이 (api, scenario) 키를 양쪽 코퍼스에서 제외한다 — nonComparableKeys 참조. */
  nonComparable?: unknown;
  [key: string]: unknown;
}

/**
 * 비교 대상 필드 — valueKeys는 양쪽 다 존재할 때만 비교(아래 compareRecords 참조).
 *
 * `errorKeys`가 여기 있는 이유: `errorName`/`errorCode`가 같아도 오류 **shape**는
 * 갈릴 수 있다. 실측(run11 2.x/iOS)에서 이 필드 없이는 키 3개가 완전 동치로
 * 집계됐다 — env1은 손으로 만든 `{ errorCode }`를, env3는 네이티브 envelope
 * (`{name,code,userInfo,moduleName,__isError}`)을 던지는데 나머지 필드가 전부
 * 같아서 계기가 못 봤다. `err.errorCode`를 읽는 코드가 env1에선 값을 얻고
 * 실기기에선 `undefined`를 얻는, 정확히 이 프로젝트가 잡으려는 종류의 갭이다.
 *
 * `errorMessage`는 **의도적으로 제외**한다. iOS CoreLocation native string처럼
 * 기기·OS별로 갈리는 자유 문자열이라 env1↔env3 대조에 넣으면 오류라는 오류가
 * 전부 불일치로 뜬다 — 그 축은 env3 내부(ios↔android) 대조에서 쓰라고 캡처하는
 * 필드지 환경 간 동치 판정용이 아니다.
 *
 * `COMPARE_FIELDS`(무조건 비교) 외에, 값-충실도 축(#329)은 전부 **양쪽-존재 게이트**
 * (`signatureFlagsFor`)를 거쳐 서명에 접힌다 — 신 스키마 필드가 구 코퍼스에 없을 때
 * 스키마-스큐가 거짓 불일치가 되지 않게 하기 위해서다:
 *   - `valueKeys`/`booleanValues` — 객체 반환의 키/boolean 값 축(기존).
 *   - `threwSync`(item 1)   — rejected 경로의 sync-throw↔async-reject 축.
 *   - `isNativeShape`(item 4) — 네이티브 브리지 오류 지문(mock synthetic vs 실 브리지).
 *   - `arrayShape`(item 3)  — 배열 **원소 스키마**(length는 변량이라 제외).
 *   - `enumValue`(item 2)   — 기기 불변 enum getter의 실제 값(allowlist API에만).
 */
const COMPARE_FIELDS = ['outcome', 'errorName', 'errorCode', 'returnType', 'errorKeys'] as const;
type CompareField =
  | (typeof COMPARE_FIELDS)[number]
  | 'valueKeys'
  | 'threwSync'
  | 'isNativeShape'
  | 'arrayElementKeys'
  | 'enumValue';

/**
 * shapeOf/shapeMultiset에 어떤 스키마-스큐 게이트 필드를 서명에 접을지 — 키마다
 * **양쪽 버킷을 함께 봐서** 정한다(양쪽 다 그 필드를 기록할 때만 true). positional
 * boolean이 6개까지 늘어 순서 착오가 위험하므로 객체로 넘긴다.
 */
interface SignatureFlags {
  valueKeys: boolean;
  booleans: boolean;
  threwSync: boolean;
  nativeShape: boolean;
  arrayShape: boolean;
  enumValue: boolean;
}

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
  /**
   * shape 집합(distinct shape의 SET)은 양쪽이 동일하지만 shape별 관측 **횟수**만
   * 갈리는 키 — `multisetsEqual`은 실패하지만 `shapeSetsEqual`은 성립하는 경우다.
   * shape/contract 차이가 없으므로 진짜 불일치가 아니다(#328). 단, `equivalentCount`
   * 에는 절대 합산하지 않는다 — 관측 횟수가 다르다는 사실 자체는 disclose해야
   * 하는 정보다(count-drift ≠ 동치, count-drift ≠ 불일치, 셋은 서로 배타적이다).
   */
  countDrift: KeyMismatch[];
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
 * `valueKeys`는 순서를 계약으로 보지 않으므로 정렬한다. `flags.valueKeys`가 false면
 * 서명에서 아예 뺀다 — "양쪽 다 존재할 때만 비교한다"는 계약을 키 단위로 지키기
 * 위해서다(`signatureFlagsFor` 참조). `flags`의 나머지 게이트 필드(#329)도 같은 계약.
 *
 * `errorKeys`도 같은 이유로 정렬해 넣되 게이트는 없다 — `valueKeys`와 달리 이
 * 필드는 슈트 최초 커밋부터 항상 배열이고(성공 시 `[]`) 두 코퍼스 모두 갖고 있다.
 * 즉 "포맷이 이 필드를 기록하는가"를 물을 필요가 없다.
 */
function shapeOf(r: CaptureRecord, flags: SignatureFlags): string {
  const base: unknown[] = [
    r.outcome ?? null,
    r.errorName ?? null,
    r.errorCode ?? null,
    r.returnType ?? null,
    Array.isArray(r.errorKeys) ? [...r.errorKeys].sort() : null,
  ];
  if (flags.valueKeys) {
    const valueKeys = Array.isArray(r.valueKeys) ? [...r.valueKeys].sort() : (r.valueKeys ?? null);
    base.push(valueKeys);
  }
  if (flags.booleans) {
    base.push(canonicalBooleans(r));
  }
  if (flags.threwSync) {
    // #329 item 1: rejected 경로에만 있는 필드 — 다른 경로/구 스키마엔 없으므로 null.
    // 양쪽 다 null이면 그대로 일치, sync-throw↔async-reject가 뒤집히면 true↔false로 발산.
    base.push(typeof r.threwSync === 'boolean' ? r.threwSync : null);
  }
  if (flags.nativeShape) {
    // #329 item 4: 네이티브 브리지 오류 지문. mock synthetic(false) vs 실 브리지(true).
    base.push(typeof r.isNativeShape === 'boolean' ? r.isNativeShape : null);
  }
  if (flags.arrayShape) {
    // #329 item 3: **원소 스키마만** 접는다 — length는 런타임 변량이라 서명에서 뺀다.
    base.push(arrayElementSignature(r));
  }
  if (flags.enumValue) {
    // #329 item 2: 기기 불변 enum getter의 실제 값(allowlist API에만 존재).
    base.push(r.enumValue ?? null);
  }
  return JSON.stringify(base);
}

/** boolean 지문을 키 정렬된 쌍 배열로 — 객체 키 순서를 계약으로 보지 않는다. */
function canonicalBooleans(r: CaptureRecord): [string, boolean][] | null {
  const bv = (r as { booleanValues?: Record<string, boolean> | null }).booleanValues;
  if (bv == null) {
    return null;
  }
  return Object.entries(bv).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * 배열 반환의 **원소 스키마** 서명(#329 item 3) — `[elementType, sorted(elementKeys)]`.
 * `length`는 넣지 않는다(앨범 사진·연락처 등 컬렉션 길이는 런타임 변량 → 거짓 불일치).
 * 빈 배열/비객체 원소는 비교할 스키마가 없으므로 null — 게이트(`hasArrayElementSchema`)가
 * 양쪽 다 non-empty 관측이 있을 때만 이 축을 켜므로 empty↔non-empty가 거짓 불일치를
 * 만들지 않는다.
 */
function arrayElementSignature(r: CaptureRecord): unknown {
  const shape = r.arrayShape;
  if (shape == null || typeof shape !== 'object') {
    return null;
  }
  const s = shape as { elementType?: unknown; elementKeys?: unknown };
  if (!Array.isArray(s.elementKeys)) {
    return null;
  }
  return [s.elementType ?? null, [...s.elementKeys].sort()];
}

/** record가 비교 가능한 valueKeys를 갖고 있는가. */
function hasValueKeys(r: CaptureRecord): boolean {
  return r.valueKeys != null;
}

/** record가 rejected 경로의 threwSync(#329 item 1)를 기록했는가 — 양쪽-존재 게이트용. */
function hasThrewSync(r: CaptureRecord): boolean {
  return typeof r.threwSync === 'boolean';
}

/** record가 isNativeShape(#329 item 4)를 기록했는가 — 구 스키마 코퍼스엔 없을 수 있다. */
function hasNativeShape(r: CaptureRecord): boolean {
  return typeof r.isNativeShape === 'boolean';
}

/** record가 **비교 가능한 배열 원소 스키마**(non-empty 배열)를 기록했는가(#329 item 3). */
function hasArrayElementSchema(r: CaptureRecord): boolean {
  const shape = r.arrayShape;
  return (
    shape != null &&
    typeof shape === 'object' &&
    Array.isArray((shape as { elementKeys?: unknown }).elementKeys)
  );
}

/** record가 enum 값(#329 item 2)을 기록했는가 — allowlist API + 신 스키마에만 존재. */
function hasEnumValue(r: CaptureRecord): boolean {
  return r.enumValue != null;
}

/**
 * record가 비교 가능한 boolean 지문을 갖고 있는가.
 *
 * `valueKeys`와 같은 게이트 계약을 따른다(`shapeMultiset` 참조) — 이 필드는 나중에
 * 추가됐으므로 그 이전 코퍼스(env3 run11 등)에는 아예 없다. 없는 쪽을 불일치로
 * 세면 재측정 안 한 환경이 통째로 붉어져 숫자가 거짓말을 한다.
 *
 * 게이트는 `every`가 아니라 `some`이다 — 묻는 건 "이 캡처가 지문을 기록하는
 * 포맷인가"이지 개별 record의 값이 아니다. 오류 경로는 `NO_VALUE_SHAPE`로
 * `booleanValues: null`을 남기므로, `every`로 걸면 reject record 하나가 섞인
 * 버킷에서 나머지 record의 지문까지 서명에서 빠져 거짓 동치가 된다(#300과
 * 같은 결함이 축만 바뀐 것).
 */
function hasBooleans(r: CaptureRecord): boolean {
  return (r as { booleanValues?: unknown }).booleanValues != null;
}

/**
 * shape → 관측 횟수. 키 하나의 멀티셋.
 *
 * `valueKeys`는 **양쪽 버킷에 그걸 기록한 record가 하나라도 있을 때** 서명에 넣는다.
 * 게이트가 묻는 건 "이 캡처가 valueKeys를 기록하는가"(포맷 역량)이지 개별 record의
 * 값이 아니다 — 그래서 `some`이지 `every`가 아니다. 서명 안에서 `null`은 결측이
 * 아니라 정상 값으로 비교된다(reject·非object 반환은 양쪽 다 null이라 그대로 일치).
 * 한쪽 버킷 전체가 null이면(valueKeys 이전 버전 캡처) 그 키에서만 비교를 뺀다.
 *
 * `every`로 게이트하면 **혼합 버킷에서 진짜 불일치를 감춘다**: reject record 하나가
 * 섞였다는 이유로 같은 버킷의 resolved record에서까지 valueKeys가 서명에서 빠져,
 * `['a','b']` vs `['a','b','c']`가 동치로 집계된다(다른 필드가 전부 같으면 그쪽에서도
 * 안 잡힌다). `getPermission :: happy-each-name`처럼 한 키에서 resolved/rejected가
 * 재현성 있게 섞이는 시나리오가 실제로 있으므로 가상의 경우가 아니다.
 */
function shapeMultiset(records: CaptureRecord[], flags: SignatureFlags): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of records) {
    const s = shapeOf(r, flags);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return counts;
}

/**
 * 키 하나의 양쪽 버킷을 함께 보고 서명 게이트 플래그를 정한다 — 모든 게이트가 같은
 * 계약을 따른다: **양쪽 버킷 다 그 필드를 기록한 record가 하나라도 있을 때만** 켠다
 * (`some`, `hasBooleans` 주석 참조). 신 스키마 필드(threwSync/arrayShape/enumValue)는
 * 구 env3 코퍼스(#330 재캡처 전)에 없으므로, 이 게이트가 재캡처 전까지 그 축을 자동으로
 * not-comparable로 두어 스키마-스큐가 거짓 불일치가 되지 않게 한다.
 */
function signatureFlagsFor(a: CaptureRecord[], b: CaptureRecord[]): SignatureFlags {
  return {
    valueKeys: a.some(hasValueKeys) && b.some(hasValueKeys),
    booleans: a.some(hasBooleans) && b.some(hasBooleans),
    threwSync: a.some(hasThrewSync) && b.some(hasThrewSync),
    nativeShape: a.some(hasNativeShape) && b.some(hasNativeShape),
    arrayShape: a.some(hasArrayElementSchema) && b.some(hasArrayElementSchema),
    enumValue: a.some(hasEnumValue) && b.some(hasEnumValue),
  };
}

function multisetsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [shape, count] of a) {
    if (b.get(shape) !== count) return false;
  }
  return true;
}

/**
 * 두 shape 멀티셋의 **키 집합**(count 무시)이 동일한가 — count-drift 판정의 핵심 가드.
 *
 * `multisetsEqual`이 count까지 요구하는 것과 달리, 이건 "어떤 distinct shape가
 * 관측됐는가"만 묻는다. `count-drift` 분류는 이 함수가 true일 때만 허용되므로,
 * 한쪽에만 있는 shape이 있으면(#308이 막으려던 바로 그 실패 모드 — 조용히 누락된
 * 관측이 거짓 동치를 만드는 것) 여전히 false를 반환해 진짜 불일치로 남는다.
 * 즉 이 가드가 #308 안전성을 지킨다: set이 다르면 count-drift 후보조차 되지 못한다.
 */
function shapeSetsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const shape of a.keys()) {
    if (!b.has(shape)) return false;
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

/**
 * 두 record 사이 필드별 mismatch를 계산한다(단일-shape 키의 읽기 좋은 상세용).
 *
 * `COMPARE_FIELDS`는 무조건 비교하고, 게이트 필드(valueKeys/threwSync/isNativeShape/
 * arrayElementKeys/enumValue)는 **양쪽 다 그 필드를 가질 때만** 비교한다 — 서명 게이트
 * (`signatureFlagsFor`)와 같은 계약이라, 스키마-스큐(한쪽만 있는 필드)가 상세에서도
 * 거짓 발산으로 보이지 않는다.
 */
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
  if (hasThrewSync(a) && hasThrewSync(b) && a.threwSync !== b.threwSync) {
    mismatches.push({ field: 'threwSync', a: a.threwSync, b: b.threwSync });
  }
  if (hasNativeShape(a) && hasNativeShape(b) && a.isNativeShape !== b.isNativeShape) {
    mismatches.push({ field: 'isNativeShape', a: a.isNativeShape, b: b.isNativeShape });
  }
  if (hasArrayElementSchema(a) && hasArrayElementSchema(b)) {
    const ea = arrayElementSignature(a);
    const eb = arrayElementSignature(b);
    if (JSON.stringify(ea) !== JSON.stringify(eb)) {
      mismatches.push({ field: 'arrayElementKeys', a: ea, b: eb });
    }
  }
  if (hasEnumValue(a) && hasEnumValue(b) && !valuesEqual(a.enumValue, b.enumValue)) {
    mismatches.push({ field: 'enumValue', a: a.enumValue, b: b.enumValue });
  }
  return mismatches;
}

/**
 * `nonComparable` 표식이 붙은 **키**를 모은다 — 레코드 단위가 아니라 키 단위다.
 *
 * 표식은 시나리오의 성질이지 특정 실행분의 성질이 아니다. 그래서 한쪽 코퍼스에서만
 * 표식이 보여도 그 키 전체를 양쪽에서 뺀다. 이게 없으면 두 방식으로 지표가 왜곡된다:
 *
 *  - **표식 도입 전에 뜬 코퍼스**(여기선 env3 run11)에는 표식이 아예 없다. 레코드
 *    단위로 거르면 env1 쪽만 빠져 같은 키가 "B에만 있는 키"(커버리지 갭)로 둔갑한다 —
 *    불일치를 줄이는 대신 갭을 늘릴 뿐 실체는 그대로다.
 *  - 반대로 나중에 env3를 다시 떠서 양쪽에 표식이 붙어도 결과가 같아야 한다.
 *    키 단위로 빼면 코퍼스 나이와 무관하게 같은 답이 나온다.
 */
function nonComparableKeys(...corpora: CaptureRecord[][]): Set<string> {
  const keys = new Set<string>();
  for (const records of corpora) {
    for (const r of records) {
      if ((r as { nonComparable?: unknown }).nonComparable != null) {
        keys.add(`${r.api} ${r.scenario}`);
      }
    }
  }
  return keys;
}

function diff(recordsA: CaptureRecord[], recordsB: CaptureRecord[]): DiffResult {
  // 비교가 성립하지 않는 시나리오는 키 단위로 양쪽에서 제외한다.
  const excluded = nonComparableKeys(recordsA, recordsB);
  const keep = (r: CaptureRecord) => !excluded.has(`${r.api} ${r.scenario}`);
  const mapA = groupByKey(recordsA.filter(keep));
  const mapB = groupByKey(recordsB.filter(keep));

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const mismatches: KeyMismatch[] = [];
  const countDrift: KeyMismatch[] = [];
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
    // 게이트 플래그는 양쪽 버킷을 함께 봐서 한 번만 정하고 A·B 서명에 똑같이 적용한다.
    const flags = signatureFlagsFor(a, b);
    const countsA = shapeMultiset(a, flags);
    const countsB = shapeMultiset(b, flags);
    if (multisetsEqual(countsA, countsB)) {
      equivalentCount++;
      continue;
    }
    // 양쪽 다 단일 shape면 필드별 상세가 읽기 좋다 — 그때만 채운다.
    const first = (bucket: CaptureRecord[]) => bucket[0] as CaptureRecord;
    const fields =
      countsA.size === 1 && countsB.size === 1 ? compareRecords(first(a), first(b)) : [];
    const entry: KeyMismatch = {
      key,
      fields,
      shapesA: describeMultiset(countsA),
      shapesB: describeMultiset(countsB),
    };
    // multisetsEqual은 실패했지만 distinct-shape 집합은 동일하다 — shape/contract
    // 차이가 아니라 순수 관측-횟수 아티팩트다(#328). shapeSetsEqual이 false라면
    // (한쪽에만 있는 shape이 존재 — #308의 실패 모드) 절대 이 분기로 오지 않는다.
    if (shapeSetsEqual(countsA, countsB)) {
      countDrift.push(entry);
      continue;
    }
    mismatches.push(entry);
  }

  mismatches.sort((x, y) => x.key.localeCompare(y.key));
  countDrift.sort((x, y) => x.key.localeCompare(y.key));
  onlyInA.sort();
  onlyInB.sort();

  return { totalKeys, equivalentCount, mismatches, countDrift, onlyInA, onlyInB };
}

function keyLabel(key: string): string {
  const [api, scenario] = key.split(' ');
  return `${api} :: ${scenario}`;
}

/** `불일치 목록`/`count-drift 목록` 공통 항목 출력 — 필드별 상세 또는 멀티셋 breakdown. */
function printKeyBreakdown(m: KeyMismatch): void {
  console.log(`  - ${keyLabel(m.key)}`);
  if (m.fields.length > 0) {
    for (const f of m.fields) {
      console.log(`      ${f.field}: A=${JSON.stringify(f.a)}  B=${JSON.stringify(f.b)}`);
    }
    return;
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

function printHuman(result: DiffResult, aDir: string, bDir: string): void {
  const { totalKeys, equivalentCount, mismatches, countDrift, onlyInA, onlyInB } = result;

  console.log(`capture diff — A: ${aDir}  B: ${bDir}`);
  console.log('');
  console.log(
    `동치 ${equivalentCount}/${totalKeys}  |  count-drift ${countDrift.length}  |  불일치 ${mismatches.length}  |  커버리지 갭: A에만 ${onlyInA.length}, B에만 ${onlyInB.length}`,
  );

  if (countDrift.length > 0) {
    console.log('');
    console.log(
      'count-drift 목록: (shape-equal, 관측 횟수만 다름 — 불일치 아님, 동치에도 합산 안 함)',
    );
    for (const m of countDrift) {
      printKeyBreakdown(m);
    }
  }

  if (mismatches.length > 0) {
    console.log('');
    console.log('불일치 목록:');
    for (const m of mismatches) {
      printKeyBreakdown(m);
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

/** `mismatches`/`countDrift` 공통 JSON shape — api/scenario로 key를 분해한다. */
function keyMismatchToJson(m: KeyMismatch) {
  return {
    api: m.key.split(' ')[0],
    scenario: m.key.split(' ')[1],
    fields: m.fields,
    shapesA: m.shapesA,
    shapesB: m.shapesB,
  };
}

function toJson(result: DiffResult): unknown {
  return {
    equivalentCount: result.equivalentCount,
    totalKeys: result.totalKeys,
    // shape 집합은 동일, 관측 횟수만 갈리는 키 — mismatches와 분리 disclose(#328).
    // equivalentCount에는 절대 포함되지 않는다.
    countDrift: result.countDrift.map(keyMismatchToJson),
    mismatches: result.mismatches.map(keyMismatchToJson),
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
