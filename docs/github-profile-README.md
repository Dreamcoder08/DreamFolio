# Dreamcoder | Arquitectura de sistemas e IA

Diseño sistemas que se mantienen inspeccionables bajo presión.

---

## Áreas de trabajo

### Sistemas con trazabilidad

Flujos que exigen evidencia verificable y revisión humana antes de cambiar de estado.

- Reglas deterministas aplicadas antes de cualquier cambio de estado
- Evidencia y decisiones rastreables de punta a punta
- Aprobación humana reservada para los puntos críticos

### Operación en entornos degradados

Captura confiable de datos donde la conectividad es limitada.

- Criterios explícitos de integridad sobre el dato capturado en sitio
- Operación pensada para baja conectividad y hardware restringido
- Menor dependencia de servicios centrales

### Infraestructura cívica

- Exploración de información pública enfocada en transparencia
- Alcance y uso de datos declarados de forma explícita
- Comportamiento del sistema auditable

### Entorno de desarrollo

- Configuración versionada y tematización consistente entre terminal, editor y shell

---

## Enfoque de ingeniería

- **Integridad sobre conveniencia** — Los sistemas de datos deben asumir condiciones adversas.
- **Rendimiento como primitivo** — La latencia es una restricción de diseño, no una optimización.
- **Autonomía componible** — Los sistemas convergen mediante interfaces robustas, no acoplamiento implícito.

---

## Dominios técnicos

| Capa           | Enfoque                                                 |
| -------------- | ------------------------------------------------------- |
| Sistemas       | Arquitectura de servicios, rendimiento, operación        |
| Datos          | Modelado, integridad, trazabilidad                       |
| Infraestructura | Linux, automatización, despliegue reproducible          |
| Interfaces     | Producto web, accesibilidad, claridad operativa          |

---

## Contacto

Perú · [github.com/dreamcoder08](https://github.com/dreamcoder08)

---

_"Build systems that remain when narratives fade."_
