export interface ProjectSignalMetric {
  label: string;
  value: string;
}

export interface ProjectCaseStudy {
  eyebrow: string;
  challenge: string;
  approach: string;
  outcome: string;
  evidence: string[];
  signals: string[];
  metrics: ProjectSignalMetric[];
  cardImpact: string;
  highlightRank: number;
}

const projectCaseStudies: Record<string, ProjectCaseStudy> = {
  drenyra: {
    eyebrow: "Espacio de trabajo con IA para contabilidad",
    challenge:
      "El trabajo contable reúne documentos, reglas y decisiones que necesitan contexto. Mi objetivo es asistir ese trabajo sin perder la revisión profesional.",
    approach:
      "Construyo un espacio de trabajo modular donde la asistencia de IA se apoya en reglas verificables, contexto explícito y revisión profesional antes de cualquier cambio de estado.",
    outcome:
      "Foco actual: integrar asistencia de IA con validación y revisión humana.",
    evidence: [
      "Separación entre asistencia de IA, validación del sistema y revisión profesional.",
      "Prácticas de trazabilidad aplicadas al trabajo contable.",
      "Captura de una etapa anterior de la interfaz, conservada como archivo del prototipo.",
    ],
    signals: ["IA", "Contabilidad", "Revisión humana"],
    metrics: [],
    cardImpact: "Asistencia contable con contexto y revisión profesional.",
    highlightRank: 1,
  },
  "digital-public-peru": {
    eyebrow: "Infraestructura de servicios públicos",
    challenge:
      "La información pública suele estar dispersa y ser difícil de auditar. El objetivo es explorarla con criterios explícitos de alcance, uso de datos y trazabilidad.",
    approach:
      "Diseño herramientas cívicas alrededor de flujos administrativos públicos, manteniendo explícitos el alcance, el uso de datos y el comportamiento del sistema.",
    outcome:
      "Una herramienta de transparencia cívica que hace la información pública más fácil de explorar y auditar.",
    evidence: [
      "Exploración de información pública enfocada en transparencia.",
      "Alcance documentado y criterios de uso explícitos.",
      "Enfoque en accesibilidad y utilidad pública.",
    ],
    signals: [
      "Tecnología cívica",
      "Integridad de servicios",
      "Operación confiable",
    ],
    metrics: [{ label: "Dominio", value: "Infraestructura pública" }],
    cardImpact:
      "Infraestructura digital cívica enfocada en integridad de servicios y operación confiable.",
    highlightRank: 3,
  },
  "edge-traz-agro": {
    eyebrow: "Trazabilidad en campo",
    challenge:
      "Mantener integridad de datos y trazabilidad donde la conectividad es limitada y los dispositivos operan de forma autónoma.",
    approach:
      "Diseño herramientas de trazabilidad para operaciones en campo, con criterios explícitos de integridad y captura confiable en sitio.",
    outcome:
      "Un enfoque de trazabilidad para operaciones remotas que mantiene los datos confiables con conectividad limitada.",
    evidence: [
      "Captura de datos en campo con criterios explícitos de integridad.",
      "Operación pensada para entornos de baja conectividad.",
      "Menor dependencia de conectividad constante.",
    ],
    signals: [
      "Operación en campo",
      "Conectividad limitada",
      "Integridad de datos",
    ],
    metrics: [],
    cardImpact:
      "Trazabilidad para operaciones distribuidas con integridad de datos en campo.",
    highlightRank: 2,
  },
  "dreamcoder-workbench": {
    eyebrow: "Entorno de desarrollo",
    challenge:
      "Un entorno de trabajo Linux reproducible que equilibra presentación visual y eficiencia operativa.",
    approach:
      "Mantengo una configuración versionada donde temas, terminal y herramientas comparten un mismo criterio.",
    outcome:
      "Un entorno de desarrollo reproducible, rápido de preparar y enfocado en claridad y baja fricción.",
    evidence: [
      "Configuración del entorno bajo control de versiones.",
      "Tematización consistente entre terminal, editor y shell.",
      "Herramientas organizadas alrededor de un solo flujo de trabajo.",
    ],
    signals: [
      "Entorno de desarrollo",
      "Configuración reproducible",
      "Herramientas de terminal",
    ],
    metrics: [],
    cardImpact:
      "Entorno de trabajo Linux reproducible con configuración unificada.",
    highlightRank: 4,
  },
};

export function getProjectCaseStudy(
  projectId: string,
): ProjectCaseStudy | undefined {
  return projectCaseStudies[projectId];
}

export function getProjectHighlightRank(projectId: string): number {
  return (
    projectCaseStudies[projectId]?.highlightRank ?? Number.MAX_SAFE_INTEGER
  );
}
