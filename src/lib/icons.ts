/** Dreamcoder Line: original UI glyphs, 24px grid, 1.6px optical stroke. */
export const icons = {
  arrow: '<path d="M6 18 18 6M7 6h11v11"/>',
  down: '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  up: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  location:
    '<path d="M18 9c0 5-6 11-6 11S6 14 6 9a6 6 0 0 1 12 0Z"/><circle cx="12" cy="9" r="2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  agents:
    '<rect x="8" y="8" width="8" height="8" rx="2"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5M5 5l3 3m8 8 3 3m0-14-3 3M5 19l3-3"/><path d="M11 12h2"/>',
  evidence:
    '<path d="M7 3h8l4 4v14H5V3h2Zm8 0v5h4M8 12h8M8 16h3"/><path d="m13 17 2 2 4-4"/>',
  terminal:
    '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/>',
  memory:
    '<path d="M7 4h10l4 3-9 4-9-4 4-3Zm-4 8 9 4 9-4M3 17l9 4 9-4"/><path d="M3 7v3m18-3v3"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  code: '<path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  // GitHub's conventional outline keeps its brand recognizable.
  github:
    '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-2.5c3.3-.4 6.8-1.6 6.8-7.3a5.7 5.7 0 0 0-1.6-4 5.3 5.3 0 0 0-.1-3.9S17.8.9 15 2.8a14 14 0 0 0-6 0C6.2.9 4.9 1.3 4.9 1.3a5.3 5.3 0 0 0-.1 3.9 5.7 5.7 0 0 0-1.6 4c0 5.7 3.5 6.9 6.8 7.3A3.5 3.5 0 0 0 9 19v3" transform="translate(1 1) scale(.9)"/>',
  x: '<path d="m4 4 12 16h4L8 4H4Zm16 0-7 8m-2 2-7 6"/>',
  mark: '<path d="m12 1 2 7 5-3-3 5 7 2-7 2 3 5-5-3-2 7-2-7-5 3 3-5-7-2 7-2-3-5 5 3 2-7Z" fill="currentColor" stroke="none"/><path d="m12 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" fill="var(--color-surface)" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12m11.32-11.32 2.12-2.12"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"/>',
} as const;
export type IconName = keyof typeof icons;
