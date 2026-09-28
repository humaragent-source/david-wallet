/* DeviceMotion shake detection with iOS permission handling. */
type DMEStatic = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

export const motionSupported = () => typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
export const needsPermission = () => motionSupported() && typeof (DeviceMotionEvent as DMEStatic).requestPermission === 'function';

/** Must be called from a user gesture (tap) on iOS. */
export async function requestMotion(): Promise<boolean> {
  if (!motionSupported()) return false;
  const D = DeviceMotionEvent as DMEStatic;
  if (typeof D.requestPermission === 'function') {
    try { return (await D.requestPermission()) === 'granted'; } catch { return false; }
  }
  return true;
}

/** Calls onShake for each detected shake. Returns an unsubscribe fn. */
export function listenShake(onShake: (strength: number) => void, threshold = 14): () => void {
  let last = 0; let px = 0, py = 0, pz = 0; let init = false;
  const h = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a || a.x == null) return;
    const x = a.x || 0, y = a.y || 0, z = a.z || 0;
    if (!init) { px = x; py = y; pz = z; init = true; return; }
    const d = Math.abs(x - px) + Math.abs(y - py) + Math.abs(z - pz);
    px = x; py = y; pz = z;
    const now = performance.now();
    if (d > threshold && now - last > 180) { last = now; onShake(d); }
  };
  window.addEventListener('devicemotion', h);
  return () => window.removeEventListener('devicemotion', h);
}

/** Heuristic: touch device that probably has an accelerometer */
export const isTouch = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
