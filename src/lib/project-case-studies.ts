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
    eyebrow: "Transparencia fiscal y participación ciudadana",
    challenge:
      "El gasto municipal es difícil de auditar y denunciar una irregularidad expone a quien la reporta. Hacía falta un portal donde el dato público sea consultable y el reporte ciudadano sea anónimo y trazable.",
    approach:
      "Arquitectura hexagonal políglota: un motor en Rust (Axum) con la máquina de estados de reportes y la detección determinista de alertas fiscales, una API en Go 1.24 y portales en Bun con TanStack Start, sobre PostgreSQL 16 y almacenamiento S3 cifrado con AES256.",
    outcome:
      "Portal ciudadano y consola de moderación funcionando de punta a punta: del reporte anónimo a su publicación verificada, con cada transición registrada en la cadena de auditoría.",
    evidence: [
      "Cadena de auditoría SHA-256 verificable desde el portal público.",
      "Exportación de contrataciones en OCDS 1.1 y contrato de API en OpenAPI 3.1.",
      "Montos en soles con aritmética exacta en céntimos, sin decimales flotantes.",
      "Moderación Triaje → Verificar → Publicar con motivo auditable y texto público redactado.",
      "Recibo anónimo de un solo uso para seguir el estado del reporte.",
    ],
    signals: ["Tecnología cívica", "Auditoría SHA-256", "OCDS 1.1"],
    metrics: [
      { label: "Motor", value: "Rust" },
      { label: "API", value: "Go" },
      { label: "Herramientas MCP", value: "13" },
    ],
    cardImpact:
      "Transparencia fiscal municipal con reportes ciudadanos anónimos y auditables.",
    highlightRank: 3,
  },
  "cominorsa-web": {
    eyebrow: "Sitio corporativo para consultoría minera",
    challenge:
      "COMINORSA acompaña a la pequeña minería y la minería artesanal de Piura y el norte del Perú. Su sitio tenía que explicar trámites técnicos como el REINFO, el IGAFOM, la DIA o las declaraciones DAC en lenguaje claro y convertir cada visita en una conversación.",
    approach:
      "Un sitio servido desde Cloudflare Workers con una página por servicio, una ruta de formalización en seis pasos y un formulario de consulta que arma el mensaje y continúa por WhatsApp con la línea elegida.",
    outcome:
      "En producción en cominorsa.com, con seis páginas de servicio, preguntas frecuentes y datos estructurados para búsquedas locales.",
    evidence: [
      "Seis servicios con página propia: qué incluye, preguntas frecuentes y contacto directo.",
      "Ruta de formalización en seis pasos, del REINFO al inicio de actividades.",
      "Consulta profesional que abre WhatsApp con el servicio y la línea elegidos.",
      "Datos estructurados JSON-LD (ProfessionalService, Service, BreadcrumbList) y sitemap con hreflang es-PE.",
    ],
    signals: ["Sitio corporativo", "SEO local", "WhatsApp"],
    metrics: [
      { label: "Servicios", value: "6" },
      { label: "Pasos de formalización", value: "6" },
      { label: "Líneas de WhatsApp", value: "2" },
    ],
    cardImpact:
      "Consultoría minera de Piura con servicios claros y consultas directas por WhatsApp.",
    highlightRank: 5,
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
