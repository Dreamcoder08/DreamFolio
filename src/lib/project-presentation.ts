export type ProjectTone =
  | 'arkonyx'
  | 'govtech'
  | 'agritech'
  | 'legaltech'
  | 'media'
  | 'systems'
  | 'design'
  | 'archive'
  | 'lab';

const toneMap: Record<string, ProjectTone> = {
  'fintech-platform': 'arkonyx',
  govtech: 'govtech',
  agritech: 'agritech',
  legaltech: 'legaltech',
  'media-tools': 'media',
  systems: 'systems',
  platform: 'systems',
  'developer-experience': 'systems',
  'knowledge-systems': 'systems',
  validation: 'govtech',
  operations: 'systems',
  portfolio: 'design',
  'design-systems': 'design',
  'creative-ui': 'design',
  audio: 'design',
  'ai-content': 'design',
  commerce: 'design',
  hospitality: 'design',
  'saas-operations': 'systems',
  'startup-ops': 'systems',
  security: 'lab',
};

export function getProjectTone(domain: string, bucket: string): ProjectTone {
  if (bucket === 'archived') {
    return 'archive';
  }

  if (bucket === 'lab') {
    return 'lab';
  }

  return toneMap[domain] ?? 'systems';
}

export function getProjectCoverClasses(tone: ProjectTone): string {
  const toneClasses: Record<ProjectTone, string> = {
    arkonyx:
      'from-primary/20 via-primary/5 to-transparent',
    govtech:
      'from-cyan/20 via-cyan/5 to-transparent',
    agritech:
      'from-sage/20 via-sage/5 to-transparent',
    legaltech:
      'from-lavender/20 via-lavender/5 to-transparent',
    media:
      'from-mauve/20 via-mauve/5 to-transparent',
    systems:
      'from-secondary/20 via-secondary/5 to-transparent',
    design:
      'from-mauve/15 via-mauve/5 to-transparent',
    archive:
      'from-muted/20 via-muted/5 to-transparent',
    lab:
      'from-accent/20 via-accent/5 to-transparent',
  };

  return toneClasses[tone];
}

export function getProjectToneLabel(tone: ProjectTone): string {
  const labels: Record<ProjectTone, string> = {
    arkonyx: 'Core System',
    govtech: 'Public Infrastructure',
    agritech: 'Edge Traceability',
    legaltech: 'Legal Intelligence',
    media: 'Media Tooling',
    systems: 'Systems Engineering',
    design: 'Interface Direction',
    archive: 'Archived Iteration',
    lab: 'Research Track',
  };

  return labels[tone];
}

export function getProjectSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
