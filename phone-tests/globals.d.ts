/**
 * Ambient globals for `*.phone.test.ts` files.
 *
 * These tests do NOT run under the local `pnpm test` (jsdom) gate. They run on a
 * real-device WebView via the `run_tests` MCP tool (`@ait-co/devtools`), which
 * injects a minimal Vitest-compatible runtime — `describe` / `it` / `test` /
 * `expect` are installed as globals there, NOT imported. This file declares
 * just enough of that surface so the files typecheck under `tsc --noEmit`
 * without pulling in a value dependency on the runtime.
 *
 * The matcher surface mirrors the subset the on-device runtime implements
 * (`@ait-co/devtools` `src/test-runner/runtime.ts`): toBe, toEqual, toBeTruthy,
 * toBeFalsy, toBeNull, toBeUndefined, toBeGreaterThan, toBeLessThan, toContain,
 * toThrow — plus `.not`. Keep this in sync if the runtime adds matchers.
 */

interface PhoneExpectation {
  readonly not: PhoneExpectation;
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeGreaterThan(n: number): void;
  toBeLessThan(n: number): void;
  toContain(sub: string): void;
  toThrow(msgFragment?: string): void;
}

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare namespace it {
  function skip(name: string, fn?: () => void | Promise<void>): void;
}
declare function test(name: string, fn: () => void | Promise<void>): void;
declare namespace test {
  function skip(name: string, fn?: () => void | Promise<void>): void;
}
declare function expect(received: unknown): PhoneExpectation;
