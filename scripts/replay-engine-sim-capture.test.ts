/**
 * replay-engine-sim-capture 회귀 — replay 경로가 env3와 **바이트 단위로 같은**
 * 레코드를 내는지 지킨다.
 *
 * 이 테스트의 존재 이유는 단 하나: canonical 경로를 우회한 hand-convert가 몰래
 * 기어들어오는 걸 막는다. 특히 rejected 프로브의 `errorKeys: ['name']`(namedError의
 * `e.name = name` own-enumerable 프로퍼티)는 diff 비교 필드라, 이게 어긋나면
 * `vibrate` 같은 프로브에서 거짓 불일치가 나 env2↔env3 수치가 거짓말을 한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { replayEngineSimFile } from './replay-engine-sim-capture';

const outDir = mkdtempSync(join(tmpdir(), 'ait-replay-'));

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

describe('replay-engine-sim-capture', () => {
  it('resolved/rejected verdict를 env3와 동일한 canonical 레코드로 낙착시킨다', async () => {
    // 실 iOS-Sim 출력의 최소 재현 — resolved 1건 + rejected 1건.
    const inputPath = join(outDir, 'in.json');
    const payload = {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15',
      verdicts: [
        {
          api: 'engine.pointerCoarse',
          verdict: { ok: true, value: { coarse: true, fine: false } },
        },
        { api: 'engine.vibrate', verdict: { ok: false, errorName: 'VibrationUnsupported' } },
      ],
    };
    const { writeFileSync } = await import('node:fs');
    writeFileSync(inputPath, JSON.stringify(payload), 'utf8');

    const n = await replayEngineSimFile(inputPath, outDir);
    expect(n).toBe(2);

    const records = JSON.parse(
      readFileSync(join(outDir, 'engine.2.x.ios-sim.json'), 'utf8'),
    ) as Record<string, unknown>[];

    const pointer = records.find((r) => r.api === 'engine.pointerCoarse');
    expect(pointer).toMatchObject({
      category: 'engine',
      scenario: 'capability-probe',
      platform: 'ios-sim',
      outcome: 'resolved',
      returnType: 'object',
      booleanValues: { coarse: true, fine: false },
    });
    expect([...(pointer?.valueKeys as string[])].sort()).toEqual(['coarse', 'fine']);

    const vibrate = records.find((r) => r.api === 'engine.vibrate');
    expect(vibrate).toMatchObject({
      outcome: 'rejected',
      errorName: 'VibrationUnsupported',
      valueKeys: null,
      booleanValues: null,
    });
    // 핵심 회귀: namedError는 own-enumerable `name` 프로퍼티를 남긴다. env3와 같아야
    // 하므로 정확히 ['name']이어야 한다 — hand-convert가 놓치는 바로 그 필드.
    expect(vibrate?.errorKeys).toEqual(['name']);
  });

  it('정본에 없는 api는 fail-fast한다 (커버리지 갭이 동치로 오인되지 않게)', async () => {
    const inputPath = join(outDir, 'bad.json');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      inputPath,
      JSON.stringify({ verdicts: [{ api: 'engine.notARealProbe', verdict: { ok: true } }] }),
      'utf8',
    );
    await expect(replayEngineSimFile(inputPath, outDir)).rejects.toThrow(/없는 api/);
  });
});
