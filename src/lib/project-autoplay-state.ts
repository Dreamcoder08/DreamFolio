export interface AutoplayConditions {
  reducedMotion: boolean;
  inView: boolean;
  documentVisible: boolean;
  hovered: boolean;
  focused: boolean;
  pausedByUser: boolean;
  itemCount: number;
}

export interface AutoplayHooks {
  advance: () => void;
  getVisibleCount: () => number;
  intervalMs?: number;
}

export interface AutoplayController {
  refresh: () => void;
  reset: () => void;
  setExternalPause: (paused: boolean) => void;
  destroy: () => void;
}

export function shouldAutoplayRun(c: AutoplayConditions): boolean {
  return (
    !c.reducedMotion &&
    c.inView &&
    c.documentVisible &&
    !c.hovered &&
    !c.focused &&
    !c.pausedByUser &&
    c.itemCount > 1
  );
}

export function nextActiveIndex(current: number, count: number): number {
  return count <= 1 ? 0 : (current + 1) % count;
}
