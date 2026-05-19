/** Centralized game timers — cleared on reset to avoid stale callbacks. */

let generation = 0;
const timerIds = new Set<ReturnType<typeof setTimeout>>();

export function bumpGameGeneration(): number {
  generation += 1;
  return generation;
}

export function getGameGeneration(): number {
  return generation;
}

export function clearGameTimers(): void {
  timerIds.forEach((id) => clearTimeout(id));
  timerIds.clear();
  bumpGameGeneration();
}

export function scheduleGameTimer(
  fn: () => void,
  delayMs: number,
  gen: number
): void {
  const id = setTimeout(() => {
    timerIds.delete(id);
    if (gen !== generation) return;
    fn();
  }, delayMs);
  timerIds.add(id);
}
