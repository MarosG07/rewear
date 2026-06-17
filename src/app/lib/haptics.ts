/** Light haptic feedback on supported devices. No-op elsewhere. */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
