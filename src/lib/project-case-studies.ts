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
    eyebrow: "Escritorio nativo para contabilidad verificable",
    challenge:
      "Los agentes contables no deberían vivir en un historial de terminal ni atrapados en una pestaña del navegador. El profesional necesita ver cada asiento propuesto, su evidencia y su estado de aprobación en un mismo lugar.",
    approach:
      "Adapto la filosofía de gentle-shell-gpui a la contabilidad: la app nativa en Rust con GPUI solo aloja; cada pestaña levanta un Drenyra Shell por JSON-RPC sobre stdio y el kernel fiscal de Drenyra AI valida libros, recibos e invariantes de partida doble. Los importes viajan como céntimos enteros, nunca como flotantes.",
    outcome:
      "Foco actual: migrar la consola web a un host nativo en Rust. La base del workspace (protocolo, espacios fiscales y binario de escritorio) está en revisión por fases.",
    evidence: [
      "Separación estricta: la app aloja, el Shell y el kernel fiscal hacen el trabajo.",
      "Revisión de asientos línea por línea con verificación de debe = haber antes de registrar.",
      "Aprobación humana obligatoria para decisiones materiales y recibo verificable sin conexión.",
    ],
    signals: ["Rust", "GPUI", "Contabilidad"],
    metrics: [],
    cardImpact:
      "Agentes contables en un escritorio nativo, con revisión profesional.",
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
  sipges: {
    eyebrow: "Alerta temprana de riesgo socioambiental",
    challenge:
      "En los proyectos mineros, las señales de conflicto llegan dispersas: eventos, demandas, actores, narrativas y compromisos anotados en lugares distintos y sin una evidencia común. Hacía falta una base única para priorizar y actuar antes de que una situación escale.",
    approach:
      "Monorepo en TypeScript con una API en Hono, una aplicación en React y contratos compartidos, sobre PostgreSQL con aislamiento por proyecto. Cada registro se clasifica en seis dimensiones (G · A · D · N · E · I) y alimenta el mapa territorial, la bandeja de pendientes y el índice de riesgo.",
    outcome:
      "En uso con los datos de un proyecto real, que no se publican aquí. Las capturas y el video usan un proyecto de demostración con datos ficticios.",
    evidence: [
      "Registros de eventos, actores, demandas, narrativas, alertas y compromisos, cada uno con su evidencia enlazada.",
      "Mapa territorial con capa satelital, filtros por dimensión y estado de la información: observado, estimado o escenario hipotético.",
      "Bandeja de pendientes priorizados en urgente, prioritario y rutina, con validación de cuatro ojos.",
      "Índice IRSA-SIPGES con puntuación, peso y disponibilidad por dimensión; su metodología está pendiente de validación.",
      "Capturas y video hechos con un proyecto de demostración y datos ficticios.",
    ],
    signals: ["Gestión socioambiental", "Alerta temprana", "Evidencia"],
    metrics: [
      { label: "Dimensiones de riesgo", value: "6" },
      { label: "Módulos de registro", value: "14" },
    ],
    cardImpact:
      "Alerta temprana de riesgo socioambiental con evidencia y trazabilidad.",
    highlightRank: 6,
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
