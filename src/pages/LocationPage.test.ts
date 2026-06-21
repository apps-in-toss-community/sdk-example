import { describe, expect, it } from 'vitest';
import { isLocationNativeError } from './LocationPage';

describe('isLocationNativeError', () => {
  it('returns true for errors containing "LocationError"', () => {
    expect(isLocationNativeError(new Error('MiniApp.LocationError 오류 1'))).toBe(true);
    expect(isLocationNativeError(new Error('LocationError: permission denied'))).toBe(true);
  });

  it('returns true for errors containing "오류"', () => {
    expect(isLocationNativeError(new Error('오류 발생'))).toBe(true);
    expect(isLocationNativeError(new Error('위치 오류'))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isLocationNativeError(new Error('Network error'))).toBe(false);
    expect(isLocationNativeError(new Error('위치 권한이 거부되었어요.'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isLocationNativeError('MiniApp.LocationError 오류 1')).toBe(false);
    expect(isLocationNativeError(null)).toBe(false);
    expect(isLocationNativeError(undefined)).toBe(false);
    expect(isLocationNativeError(42)).toBe(false);
    expect(isLocationNativeError({ message: 'LocationError' })).toBe(false);
  });
});
