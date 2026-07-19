#!/usr/bin/env bash
# engine 프로브 9종을 iOS Simulator(실 iOS WebKit)에서 실행한다.
#
# 왜: 데스크톱 webkit은 env2(실기기 WebKit)의 근사치이고, 그 오차를 폰 없이
# 재려면 실기기와 같은 WebKit 빌드를 쓰는 Simulator가 필요하다. 자세한 배경은
# scripts/build-engine-probe-page.ts 헤더 참조.
#
# 요구: Xcode + iOS 런타임 1개 이상. macOS 전용이라 다른 플랫폼으로 위임 불가.
#       메모리가 빠듯한 머신에서는 돌리지 말 것 — Simulator는 무겁다.
#
# 사용:
#   bash scripts/run-engine-probes-ios-sim.sh                 # 기본 기기 자동 선택
#   AIT_SIM_DEVICE="iPhone 17 Pro" bash scripts/run-engine-probes-ios-sim.sh
#
# 산출: .ait-engine-sim/<device>.json  (verdict + userAgent, gitignored)
#
# 커뮤니티 오픈소스 프로젝트입니다.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun이 없습니다 — Xcode가 설치된 macOS에서 실행하세요." >&2
  exit 1
fi

DEVICE_NAME="${AIT_SIM_DEVICE:-}"
PORT="${AIT_SIM_PORT:-8899}"
OUT_DIR=".ait-engine-sim"
mkdir -p "$OUT_DIR"

# 사용 가능한 iPhone 시뮬레이터 하나를 고른다 (이름 지정이 없으면 첫 번째).
UDID="$(xcrun simctl list devices available -j | python3 -c "
import json, sys, os
want = os.environ.get('DEVICE_NAME') or ''
devices = json.load(sys.stdin)['devices']
for runtime, entries in devices.items():
    if 'iOS' not in runtime:
        continue
    for d in entries:
        if not d['name'].startswith('iPhone'):
            continue
        if want and d['name'] != want:
            continue
        print(d['udid'], d['name'], sep='\t')
        raise SystemExit(0)
raise SystemExit('조건에 맞는 iPhone 시뮬레이터를 찾지 못했습니다.')
" DEVICE_NAME="$DEVICE_NAME")"

SIM_UDID="$(echo "$UDID" | cut -f1)"
SIM_NAME="$(echo "$UDID" | cut -f2)"
SAFE_NAME="$(echo "$SIM_NAME" | tr ' ' '-')"
RESULT="$OUT_DIR/$SAFE_NAME.json"
PAGE="$OUT_DIR/engine-probe.html"

echo "simulator: $SIM_NAME"

# 프로브 페이지를 정본에서 생성한다 (손으로 쓴 사본이 아니다).
pnpm exec tsx scripts/build-engine-probe-page.ts "$PAGE"

xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
xcrun simctl bootstatus "$SIM_UDID" -b >/dev/null 2>&1 || true

rm -f "$RESULT"
node scripts/engine-probe-collect.mjs "$PAGE" "$RESULT" "$PORT" &
COLLECTOR=$!
trap 'kill "$COLLECTOR" 2>/dev/null || true' EXIT

sleep 3
xcrun simctl openurl "$SIM_UDID" "http://127.0.0.1:$PORT/"

for _ in $(seq 1 60); do
  [ -f "$RESULT" ] && break
  sleep 1
done

if [ ! -f "$RESULT" ]; then
  echo "verdict를 받지 못했습니다 — Simulator에서 Safari가 열렸는지 확인하세요." >&2
  exit 2
fi

echo
echo "결과 -> $RESULT"
python3 -c "
import json, sys
d = json.load(open('$RESULT'))
print('UA:', d['userAgent'])
for v in d['verdicts']:
    r = v['verdict']
    if r.get('ok'):
        print(f\"  {v['api']:<28} resolved  {json.dumps(r.get('value'), ensure_ascii=False)}\")
    else:
        print(f\"  {v['api']:<28} rejected  {r.get('errorName')}\")
"
