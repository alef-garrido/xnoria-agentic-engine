/**
 * Centralized, type-safe intervention definitions
 * Phase 1 of CX Architecture Refactoring
 * 
 * RFC: https://github.com/slemat-cx-churn-wheel/RFC_ARCHITECTURE_REFACTORING.md
 * 
 * This registry is the single source of truth for all interventions.
 * It enables:
 * - TypeScript compile-time validation of intervention references
 * - No more silent failures from missing interventions
 * - Easy additions with full IDE autocomplete
 * - Efficient tree-shaking of unused code
 * 
 * All 138 interventions across 8 domains and ~50 signals
 */

export const INTERVENTIONS = {
  // ============================================================================
  // ACQ (Acquisition) - Visibility
  // ============================================================================
  "INT_ACQ_VIS_01_A": { id: "INT_ACQ_VIS_01_A", signal: "ACQ_VIS_01", option: "A" as const, translations: { en: "launch targeted display ads", es: "lanzar anuncios gráficos dirigidos" } },
  "INT_ACQ_VIS_01_B": { id: "INT_ACQ_VIS_01_B", signal: "ACQ_VIS_01", option: "B" as const, translations: { en: "partner with industry influencers", es: "asociarse con influencers de la industria" } },
  "INT_ACQ_VIS_01_C": { id: "INT_ACQ_VIS_01_C", signal: "ACQ_VIS_01", option: "C" as const, translations: { en: "optimize social media profiles", es: "optimizar perfiles de redes sociales" } },
  "INT_ACQ_VIS_02_A": { id: "INT_ACQ_VIS_02_A", signal: "ACQ_VIS_02", option: "A" as const, translations: { en: "run paid search campaigns", es: "ejecutar campañas de búsqueda pagada" } },
  "INT_ACQ_VIS_02_B": { id: "INT_ACQ_VIS_02_B", signal: "ACQ_VIS_02", option: "B" as const, translations: { en: "improve technical SEO", es: "mejorar SEO técnico" } },
  "INT_ACQ_VIS_02_C": { id: "INT_ACQ_VIS_02_C", signal: "ACQ_VIS_02", option: "C" as const, translations: { en: "increase content publication frequency", es: "aumentar la frecuencia de publicación" } },

  // ============================================================================
  // ACQ (Acquisition) - Clarity
  // ============================================================================
  "INT_ACQ_CLR_01_A": { id: "INT_ACQ_CLR_01_A", signal: "ACQ_CLR_01", option: "A" as const, translations: { en: "clarify value proposition above the fold", es: "aclarar propuesta de valor en la sección superior" } },
  "INT_ACQ_CLR_01_B": { id: "INT_ACQ_CLR_01_B", signal: "ACQ_CLR_01", option: "B" as const, translations: { en: "simplify headline to one primary outcome", es: "simplificar titular a un resultado principal" } },
  "INT_ACQ_CLR_01_C": { id: "INT_ACQ_CLR_01_C", signal: "ACQ_CLR_01", option: "C" as const, translations: { en: "remove competing CTAs on landing page", es: "eliminar CTAs competidores en página de inicio" } },
  "INT_ACQ_CLR_02_A": { id: "INT_ACQ_CLR_02_A", signal: "ACQ_CLR_02", option: "A" as const, translations: { en: "redesign above-the-fold section for clarity", es: "rediseñar sección superior para claridad" } },
  "INT_ACQ_CLR_02_B": { id: "INT_ACQ_CLR_02_B", signal: "ACQ_CLR_02", option: "B" as const, translations: { en: "align ad message with landing page copy", es: "alinear mensaje del anuncio con texto de página" } },
  "INT_ACQ_CLR_02_C": { id: "INT_ACQ_CLR_02_C", signal: "ACQ_CLR_02", option: "C" as const, translations: { en: "add visual hierarchy to guide first scroll", es: "añadir jerarquía visual para guiar primer desplazamiento" } },

  // ============================================================================
  // ACQ (Acquisition) - Trust
  // ============================================================================
  "INT_ACQ_TRU_01_A": { id: "INT_ACQ_TRU_01_A", signal: "ACQ_TRU_01", option: "A" as const, translations: { en: "trigger cart abandonment emails", es: "enviar correos de carrito abandonado" } },
  "INT_ACQ_TRU_01_B": { id: "INT_ACQ_TRU_01_B", signal: "ACQ_TRU_01", option: "B" as const, translations: { en: "simplify checkout process", es: "simplificar proceso de pago" } },
  "INT_ACQ_TRU_01_C": { id: "INT_ACQ_TRU_01_C", signal: "ACQ_TRU_01", option: "C" as const, translations: { en: "highlight return policy", es: "destacar política de devoluciones" } },
  "INT_ACQ_TRU_02_A": { id: "INT_ACQ_TRU_02_A", signal: "ACQ_TRU_02", option: "A" as const, translations: { en: "add live chat bot on pricing page", es: "añadir chat en vivo en página de precios" } },
  "INT_ACQ_TRU_02_B": { id: "INT_ACQ_TRU_02_B", signal: "ACQ_TRU_02", option: "B" as const, translations: { en: "offer free trial or money-back guarantee", es: "ofrecer prueba gratuita o garantía de devolución" } },
  "INT_ACQ_TRU_02_C": { id: "INT_ACQ_TRU_02_C", signal: "ACQ_TRU_02", option: "C" as const, translations: { en: "showcase customer testimonials", es: "mostrar testimonios de clientes" } },

  // ============================================================================
  // SAL (Sales Experience) - Clarity
  // ============================================================================
  "INT_SAL_CLR_01_A": { id: "INT_SAL_CLR_01_A", signal: "SAL_CLR_01", option: "A" as const, translations: { en: "define offer with explicit deliverables and outcomes", es: "definir oferta con entregables y resultados explícitos" } },
  "INT_SAL_CLR_01_B": { id: "INT_SAL_CLR_01_B", signal: "SAL_CLR_01", option: "B" as const, translations: { en: "create structured pricing tiers", es: "crear niveles de precios estructurados" } },
  "INT_SAL_CLR_01_C": { id: "INT_SAL_CLR_01_C", signal: "SAL_CLR_01", option: "C" as const, translations: { en: "add comparison table between plans", es: "añadir tabla comparativa entre planes" } },
  "INT_SAL_CLR_02_A": { id: "INT_SAL_CLR_02_A", signal: "SAL_CLR_02", option: "A" as const, translations: { en: "publish public pricing page", es: "publicar página de precios pública" } },
  "INT_SAL_CLR_02_B": { id: "INT_SAL_CLR_02_B", signal: "SAL_CLR_02", option: "B" as const, translations: { en: "remove hidden setup fees", es: "eliminar tarifas de configuración ocultas" } },
  "INT_SAL_CLR_02_C": { id: "INT_SAL_CLR_02_C", signal: "SAL_CLR_02", option: "C" as const, translations: { en: "provide interactive cost calculator", es: "proporcionar calculadora de costos interactiva" } },

  // ============================================================================
  // SAL (Sales Experience) - Value Perception
  // ============================================================================
  "INT_SAL_VAL_01_A": { id: "INT_SAL_VAL_01_A", signal: "SAL_VAL_01", option: "A" as const, translations: { en: "equip sales with ROI calculators", es: "equipar ventas con calculadoras de ROI" } },
  "INT_SAL_VAL_01_B": { id: "INT_SAL_VAL_01_B", signal: "SAL_VAL_01", option: "B" as const, translations: { en: "implement value-based selling framework", es: "implementar marco de venta basado en valor" } },
  "INT_SAL_VAL_01_C": { id: "INT_SAL_VAL_01_C", signal: "SAL_VAL_01", option: "C" as const, translations: { en: "highlight cost of inaction", es: "destacar costo de la inacción" } },
  "INT_SAL_VAL_02_A": { id: "INT_SAL_VAL_02_A", signal: "SAL_VAL_02", option: "A" as const, translations: { en: "refine sales qualification process", es: "refinar proceso de calificación de ventas" } },
  "INT_SAL_VAL_02_B": { id: "INT_SAL_VAL_02_B", signal: "SAL_VAL_02", option: "B" as const, translations: { en: "shorten sales cycle stages", es: "acortar etapas del ciclo de ventas" } },
  "INT_SAL_VAL_02_C": { id: "INT_SAL_VAL_02_C", signal: "SAL_VAL_02", option: "C" as const, translations: { en: "provide objection handling scripts", es: "proporcionar guiones de manejo de objeciones" } },

  // ============================================================================
  // SAL (Sales Experience) - Trust
  // ============================================================================
  "INT_SAL_TRU_01_A": { id: "INT_SAL_TRU_01_A", signal: "SAL_TRU_01", option: "A" as const, translations: { en: "use live customer examples during demo", es: "usar ejemplos reales de clientes en demostración" } },
  "INT_SAL_TRU_01_B": { id: "INT_SAL_TRU_01_B", signal: "SAL_TRU_01", option: "B" as const, translations: { en: "offer proof-of-concept trial", es: "ofrecer prueba de concepto" } },
  "INT_SAL_TRU_01_C": { id: "INT_SAL_TRU_01_C", signal: "SAL_TRU_01", option: "C" as const, translations: { en: "bring technical experts to calls", es: "incluir expertos técnicos en llamadas" } },
  "INT_SAL_TRU_02_A": { id: "INT_SAL_TRU_02_A", signal: "SAL_TRU_02", option: "A" as const, translations: { en: "create competitive battlecards", es: "crear tarjetas de batalla competitiva" } },
  "INT_SAL_TRU_02_B": { id: "INT_SAL_TRU_02_B", signal: "SAL_TRU_02", option: "B" as const, translations: { en: "run customized tear-down of competitor flaws", es: "ejecutar análisis personalizado de flaquezas de competencia" } },
  "INT_SAL_TRU_02_C": { id: "INT_SAL_TRU_02_C", signal: "SAL_TRU_02", option: "C" as const, translations: { en: "highlight unique proprietary features", es: "destacar características propietarias únicas" } },

  // ============================================================================
  // ONB (Onboarding) - Friction
  // ============================================================================
  "INT_ONB_FRC_01_A": { id: "INT_ONB_FRC_01_A", signal: "ONB_FRC_01", option: "A" as const, translations: { en: "reduce number of required steps", es: "reducir número de pasos requeridos" } },
  "INT_ONB_FRC_01_B": { id: "INT_ONB_FRC_01_B", signal: "ONB_FRC_01", option: "B" as const, translations: { en: "enable progressive data collection", es: "habilitar recopilación progresiva de datos" } },
  "INT_ONB_FRC_01_C": { id: "INT_ONB_FRC_01_C", signal: "ONB_FRC_01", option: "C" as const, translations: { en: "remove non-essential form fields", es: "eliminar campos de formulario no esenciales" } },
  "INT_ONB_FRC_02_A": { id: "INT_ONB_FRC_02_A", signal: "ONB_FRC_02", option: "A" as const, translations: { en: "provide setup templates", es: "proporcionar plantillas de configuración" } },
  "INT_ONB_FRC_02_B": { id: "INT_ONB_FRC_02_B", signal: "ONB_FRC_02", option: "B" as const, translations: { en: "offer white-glove onboarding", es: "ofrecer servicio premium de incorporación" } },
  "INT_ONB_FRC_02_C": { id: "INT_ONB_FRC_02_C", signal: "ONB_FRC_02", option: "C" as const, translations: { en: "improve error handling in forms", es: "mejorar manejo de errores en formularios" } },

  // ============================================================================
  // ONB (Onboarding) - Clarity
  // ============================================================================
  "INT_ONB_CLR_01_A": { id: "INT_ONB_CLR_01_A", signal: "ONB_CLR_01", option: "A" as const, translations: { en: "introduce guided onboarding checklist", es: "introducir lista de verificación guiada" } },
  "INT_ONB_CLR_01_B": { id: "INT_ONB_CLR_01_B", signal: "ONB_CLR_01", option: "B" as const, translations: { en: "add primary CTA for next action", es: "añadir CTA primario para próxima acción" } },
  "INT_ONB_CLR_01_C": { id: "INT_ONB_CLR_01_C", signal: "ONB_CLR_01", option: "C" as const, translations: { en: "reduce optional paths during onboarding", es: "reducir caminos opcionales durante incorporación" } },

  // ============================================================================
  // ONB (Onboarding) - Capability
  // ============================================================================
  "INT_ONB_CAP_01_A": { id: "INT_ONB_CAP_01_A", signal: "ONB_CAP_01", option: "A" as const, translations: { en: "add interactive product walkthrough", es: "añadir recorrido interactivo por el producto" } },
  "INT_ONB_CAP_01_B": { id: "INT_ONB_CAP_01_B", signal: "ONB_CAP_01", option: "B" as const, translations: { en: "provide contextual tooltips on first use", es: "proporcionar información emergente contextual en primer uso" } },
  "INT_ONB_CAP_01_C": { id: "INT_ONB_CAP_01_C", signal: "ONB_CAP_01", option: "C" as const, translations: { en: "include quick-start tutorial", es: "incluir tutorial de inicio rápido" } },

  // ============================================================================
  // PRD (Product Experience) - Friction
  // ============================================================================
  "INT_PRD_FRC_01_A": { id: "INT_PRD_FRC_01_A", signal: "PRD_FRC_01", option: "A" as const, translations: { en: "reduce steps required to complete core task", es: "reducir pasos para completar tarea principal" } },
  "INT_PRD_FRC_01_B": { id: "INT_PRD_FRC_01_B", signal: "PRD_FRC_01", option: "B" as const, translations: { en: "eliminate redundant inputs", es: "eliminar entradas redundantes" } },
  "INT_PRD_FRC_01_C": { id: "INT_PRD_FRC_01_C", signal: "PRD_FRC_01", option: "C" as const, translations: { en: "improve loading and response times", es: "mejorar tiempos de carga y respuesta" } },
  "INT_PRD_FRC_02_A": { id: "INT_PRD_FRC_02_A", signal: "PRD_FRC_02", option: "A" as const, translations: { en: "trigger email adoption campaigns", es: "enviar campañas de correo para adopción" } },
  "INT_PRD_FRC_02_B": { id: "INT_PRD_FRC_02_B", signal: "PRD_FRC_02", option: "B" as const, translations: { en: "simplify feature discovery UI", es: "simplificar interfaz de descubrimiento de funciones" } },
  "INT_PRD_FRC_02_C": { id: "INT_PRD_FRC_02_C", signal: "PRD_FRC_02", option: "C" as const, translations: { en: "add empty-state templates", es: "añadir plantillas de estado vacío" } },

  // ============================================================================
  // PRD (Product Experience) - Capability
  // ============================================================================
  "INT_PRD_CAP_01_A": { id: "INT_PRD_CAP_01_A", signal: "PRD_CAP_01", option: "A" as const, translations: { en: "highlight key features with in-app prompts", es: "destacar funciones clave con avisos en la aplicación" } },
  "INT_PRD_CAP_01_B": { id: "INT_PRD_CAP_01_B", signal: "PRD_CAP_01", option: "B" as const, translations: { en: "surface use-case examples inside product", es: "mostrar ejemplos de casos de uso en el producto" } },
  "INT_PRD_CAP_01_C": { id: "INT_PRD_CAP_01_C", signal: "PRD_CAP_01", option: "C" as const, translations: { en: "trigger contextual feature education", es: "activar educación de características contextual" } },
  "INT_PRD_CAP_02_A": { id: "INT_PRD_CAP_02_A", signal: "PRD_CAP_02", option: "A" as const, translations: { en: "build native integrations", es: "construir integraciones nativas" } },
  "INT_PRD_CAP_02_B": { id: "INT_PRD_CAP_02_B", signal: "PRD_CAP_02", option: "B" as const, translations: { en: "release advanced configuration options", es: "publicar opciones de configuración avanzada" } },
  "INT_PRD_CAP_02_C": { id: "INT_PRD_CAP_02_C", signal: "PRD_CAP_02", option: "C" as const, translations: { en: "implement public product roadmap", es: "implementar hoja de ruta pública del producto" } },

  // ============================================================================
  // PRD (Product Experience) - Consistency
  // ============================================================================
  "INT_PRD_CST_01_A": { id: "INT_PRD_CST_01_A", signal: "PRD_CST_01", option: "A" as const, translations: { en: "standardize UI patterns across product", es: "estandarizar patrones de interfaz en el producto" } },
  "INT_PRD_CST_01_B": { id: "INT_PRD_CST_01_B", signal: "PRD_CST_01", option: "B" as const, translations: { en: "unify tone and messaging across channels", es: "unificar tono y mensaje en todos los canales" } },
  "INT_PRD_CST_01_C": { id: "INT_PRD_CST_01_C", signal: "PRD_CST_01", option: "C" as const, translations: { en: "align support and product responses", es: "alinear respuestas de soporte y producto" } },
  "INT_PRD_CST_02_A": { id: "INT_PRD_CST_02_A", signal: "PRD_CST_02", option: "A" as const, translations: { en: "increase test automation coverage", es: "aumentar cobertura de automatización de pruebas" } },
  "INT_PRD_CST_02_B": { id: "INT_PRD_CST_02_B", signal: "PRD_CST_02", option: "B" as const, translations: { en: "implement rapid hotfix deployment", es: "implementar despliegue rápido de correcciones" } },
  "INT_PRD_CST_02_C": { id: "INT_PRD_CST_02_C", signal: "PRD_CST_02", option: "C" as const, translations: { en: "prioritize technical debt resolution", es: "priorizar resolución de deuda técnica" } },

  // ============================================================================
  // SUP (Support & Service) - Responsiveness
  // ============================================================================
  "INT_SUP_RES_01_A": { id: "INT_SUP_RES_01_A", signal: "SUP_RES_01", option: "A" as const, translations: { en: "implement SLA-based response targets", es: "implementar objetivos de respuesta basados en SLA" } },
  "INT_SUP_RES_01_B": { id: "INT_SUP_RES_01_B", signal: "SUP_RES_01", option: "B" as const, translations: { en: "enable auto-acknowledgement replies", es: "habilitar confirmaciones automáticas" } },
  "INT_SUP_RES_01_C": { id: "INT_SUP_RES_01_C", signal: "SUP_RES_01", option: "C" as const, translations: { en: "route tickets based on priority", es: "enrutar tickets según prioridad" } },
  "INT_SUP_RES_02_A": { id: "INT_SUP_RES_02_A", signal: "SUP_RES_02", option: "A" as const, translations: { en: "empower front-line agents to issue refunds", es: "autorizar agentes de primera línea para emitir reembolsos" } },
  "INT_SUP_RES_02_B": { id: "INT_SUP_RES_02_B", signal: "SUP_RES_02", option: "B" as const, translations: { en: "improve triage accuracy", es: "mejorar precisión del triage" } },
  "INT_SUP_RES_02_C": { id: "INT_SUP_RES_02_C", signal: "SUP_RES_02", option: "C" as const, translations: { en: "establish tier-2 support escalation paths", es: "establecer rutas de escalada de soporte Tier 2" } },

  // ============================================================================
  // SUP (Support & Service) - Capability
  // ============================================================================
  "INT_SUP_CAP_01_A": { id: "INT_SUP_CAP_01_A", signal: "SUP_CAP_01", option: "A" as const, translations: { en: "implement internal knowledge base", es: "implementar base de conocimiento interna" } },
  "INT_SUP_CAP_01_B": { id: "INT_SUP_CAP_01_B", signal: "SUP_CAP_01", option: "B" as const, translations: { en: "standardize support response playbooks", es: "estandarizar libros de jugadas de soporte" } },
  "INT_SUP_CAP_01_C": { id: "INT_SUP_CAP_01_C", signal: "SUP_CAP_01", option: "C" as const, translations: { en: "train agents on top recurring issues", es: "capacitar agentes en problemas recurrentes principales" } },
  "INT_SUP_CAP_02_A": { id: "INT_SUP_CAP_02_A", signal: "SUP_CAP_02", option: "A" as const, translations: { en: "introduce root-cause analysis for top tickets", es: "introducir análisis de causa raíz para tickets principales" } },
  "INT_SUP_CAP_02_B": { id: "INT_SUP_CAP_02_B", signal: "SUP_CAP_02", option: "B" as const, translations: { en: "enhance self-service portal", es: "mejorar portal de autoservicio" } },
  "INT_SUP_CAP_02_C": { id: "INT_SUP_CAP_02_C", signal: "SUP_CAP_02", option: "C" as const, translations: { en: "send proactive status updates", es: "enviar actualizaciones de estado proactivas" } },

  // ============================================================================
  // SUP (Support & Service) - Consistency
  // ============================================================================
  "INT_SUP_CST_01_A": { id: "INT_SUP_CST_01_A", signal: "SUP_CST_01", option: "A" as const, translations: { en: "centralize agent knowledge base", es: "centralizar base de conocimiento de agentes" } },
  "INT_SUP_CST_01_B": { id: "INT_SUP_CST_01_B", signal: "SUP_CST_01", option: "B" as const, translations: { en: "conduct regular QA ticket reviews", es: "realizar revisiones regulares de control de calidad" } },
  "INT_SUP_CST_01_C": { id: "INT_SUP_CST_01_C", signal: "SUP_CST_01", option: "C" as const, translations: { en: "introduce standardized macros", es: "introducir macros estandarizados" } },
  "INT_SUP_CST_02_A": { id: "INT_SUP_CST_02_A", signal: "SUP_CST_02", option: "A" as const, translations: { en: "route follow-ups to original agent", es: "enrutar seguimientos al agente original" } },
  "INT_SUP_CST_02_B": { id: "INT_SUP_CST_02_B", signal: "SUP_CST_02", option: "B" as const, translations: { en: "implement shared customer context dashboard", es: "implementar panel compartido de contexto de cliente" } },
  "INT_SUP_CST_02_C": { id: "INT_SUP_CST_02_C", signal: "SUP_CST_02", option: "C" as const, translations: { en: "shift to pod-based support model", es: "cambiar a modelo de soporte basado en equipos" } },

  // ============================================================================
  // COM (Communication & Engagement) - Relationship
  // ============================================================================
  "INT_COM_REL_01_A": { id: "INT_COM_REL_01_A", signal: "COM_REL_01", option: "A" as const, translations: { en: "personalize communication based on behavior", es: "personalizar comunicación basada en comportamiento" } },
  "INT_COM_REL_01_B": { id: "INT_COM_REL_01_B", signal: "COM_REL_01", option: "B" as const, translations: { en: "introduce lifecycle-based messaging", es: "introducir mensajería basada en ciclo de vida" } },
  "INT_COM_REL_01_C": { id: "INT_COM_REL_01_C", signal: "COM_REL_01", option: "C" as const, translations: { en: "maintain consistent brand voice", es: "mantener voz de marca consistente" } },
  "INT_COM_REL_02_A": { id: "INT_COM_REL_02_A", signal: "COM_REL_02", option: "A" as const, translations: { en: "implement re-engagement campaigns", es: "implementar campañas de reenganche" } },
  "INT_COM_REL_02_B": { id: "INT_COM_REL_02_B", signal: "COM_REL_02", option: "B" as const, translations: { en: "personalize content based on usage", es: "personalizar contenido basado en uso" } },
  "INT_COM_REL_02_C": { id: "INT_COM_REL_02_C", signal: "COM_REL_02", option: "C" as const, translations: { en: "introduce feedback loops", es: "introducir bucles de retroalimentación" } },

  // ============================================================================
  // COM (Communication & Engagement) - Responsiveness
  // ============================================================================
  "INT_COM_RES_01_A": { id: "INT_COM_RES_01_A", signal: "COM_RES_01", option: "A" as const, translations: { en: "automate triggered messages (email/SMS)", es: "automatizar mensajes activados (correo/SMS)" } },
  "INT_COM_RES_01_B": { id: "INT_COM_RES_01_B", signal: "COM_RES_01", option: "B" as const, translations: { en: "reduce manual approval bottlenecks", es: "reducir cuellos de botella de aprobación manual" } },
  "INT_COM_RES_01_C": { id: "INT_COM_RES_01_C", signal: "COM_RES_01", option: "C" as const, translations: { en: "implement real-time notifications", es: "implementar notificaciones en tiempo real" } },
  "INT_COM_RES_02_A": { id: "INT_COM_RES_02_A", signal: "COM_RES_02", option: "A" as const, translations: { en: "launch community forum", es: "lanzar foro comunitario" } },
  "INT_COM_RES_02_B": { id: "INT_COM_RES_02_B", signal: "COM_RES_02", option: "B" as const, translations: { en: "host interactive webinars", es: "alojar seminarios web interactivos" } },
  "INT_COM_RES_02_C": { id: "INT_COM_RES_02_C", signal: "COM_RES_02", option: "C" as const, translations: { en: "enable in-app two-way chat", es: "habilitar chat bidireccional en la aplicación" } },

  // ============================================================================
  // COM (Communication & Engagement) - Consistency
  // ============================================================================
  "INT_COM_CST_01_A": { id: "INT_COM_CST_01_A", signal: "COM_CST_01", option: "A" as const, translations: { en: "consolidate marketing and product communications", es: "consolidar comunicaciones de marketing y producto" } },
  "INT_COM_CST_01_B": { id: "INT_COM_CST_01_B", signal: "COM_CST_01", option: "B" as const, translations: { en: "publish centralized brand guidelines", es: "publicar directrices de marca centralizadas" } },
  "INT_COM_CST_01_C": { id: "INT_COM_CST_01_C", signal: "COM_CST_01", option: "C" as const, translations: { en: "implement cross-channel review process", es: "implementar proceso de revisión multicanal" } },
  "INT_COM_CST_02_A": { id: "INT_COM_CST_02_A", signal: "COM_CST_02", option: "A" as const, translations: { en: "audit third-party agencies", es: "auditar agencias de terceros" } },
  "INT_COM_CST_02_B": { id: "INT_COM_CST_02_B", signal: "COM_CST_02", option: "B" as const, translations: { en: "train customer-facing roles on brand voice", es: "capacitar roles orientados al cliente en voz de marca" } },
  "INT_COM_CST_02_C": { id: "INT_COM_CST_02_C", signal: "COM_CST_02", option: "C" as const, translations: { en: "establish unified content calendar", es: "establecer calendario de contenido unificado" } },

  // ============================================================================
  // RET (Retention & Loyalty) - Value Perception
  // ============================================================================
  "INT_RET_VAL_01_A": { id: "INT_RET_VAL_01_A", signal: "RET_VAL_01", option: "A" as const, translations: { en: "reinforce ROI through usage insights", es: "reforzar ROI a través de perspectivas de uso" } },
  "INT_RET_VAL_01_B": { id: "INT_RET_VAL_01_B", signal: "RET_VAL_01", option: "B" as const, translations: { en: "send periodic value reports", es: "enviar reportes de valor periódicos" } },
  "INT_RET_VAL_01_C": { id: "INT_RET_VAL_01_C", signal: "RET_VAL_01", option: "C" as const, translations: { en: "highlight achieved outcomes", es: "destacar resultados logrados" } },
  "INT_RET_VAL_02_A": { id: "INT_RET_VAL_02_A", signal: "RET_VAL_02", option: "A" as const, translations: { en: "introduce custom retention packaging", es: "introducir empaquetado de retención personalizado" } },
  "INT_RET_VAL_02_B": { id: "INT_RET_VAL_02_B", signal: "RET_VAL_02", option: "B" as const, translations: { en: "emphasize switching friction", es: "enfatizar fricción de cambio" } },
  "INT_RET_VAL_02_C": { id: "INT_RET_VAL_02_C", signal: "RET_VAL_02", option: "C" as const, translations: { en: "offer discount for annual lock", es: "ofrecer descuento por bloqueo anual" } },

  // ============================================================================
  // RET (Retention & Loyalty) - Relationship
  // ============================================================================
  "INT_RET_REL_01_A": { id: "INT_RET_REL_01_A", signal: "RET_REL_01", option: "A" as const, translations: { en: "trigger health score alerts", es: "activar alertas de puntuación de salud" } },
  "INT_RET_REL_01_B": { id: "INT_RET_REL_01_B", signal: "RET_REL_01", option: "B" as const, translations: { en: "assign executives to at-risk accounts", es: "asignar ejecutivos a cuentas en riesgo" } },
  "INT_RET_REL_01_C": { id: "INT_RET_REL_01_C", signal: "RET_REL_01", option: "C" as const, translations: { en: "conduct pulse surveys", es: "realizar encuestas por pulso" } },
  "INT_RET_REL_02_A": { id: "INT_RET_REL_02_A", signal: "RET_REL_02", option: "A" as const, translations: { en: "force quarterly business reviews", es: "forzar revisiones comerciales trimestrales" } },
  "INT_RET_REL_02_B": { id: "INT_RET_REL_02_B", signal: "RET_REL_02", option: "B" as const, translations: { en: "rotate stagnant account managers", es: "rotar gerentes de cuenta estancados" } },
  "INT_RET_REL_02_C": { id: "INT_RET_REL_02_C", signal: "RET_REL_02", option: "C" as const, translations: { en: "launch relationship-building events", es: "lanzar eventos de construcción de relaciones" } },

  // ============================================================================
  // RET (Retention & Loyalty) - Trust
  // ============================================================================
  "INT_RET_TRU_01_A": { id: "INT_RET_TRU_01_A", signal: "RET_TRU_01", option: "A" as const, translations: { en: "display testimonials and social proof", es: "mostrar testimonios y prueba social" } },
  "INT_RET_TRU_01_B": { id: "INT_RET_TRU_01_B", signal: "RET_TRU_01", option: "B" as const, translations: { en: "improve transparency in pricing", es: "mejorar transparencia en precios" } },
  "INT_RET_TRU_01_C": { id: "INT_RET_TRU_01_C", signal: "RET_TRU_01", option: "C" as const, translations: { en: "communicate updates proactively", es: "comunicar actualizaciones proactivamente" } },
  "INT_RET_TRU_02_A": { id: "INT_RET_TRU_02_A", signal: "RET_TRU_02", option: "A" as const, translations: { en: "launch proactive damage control", es: "lanzar control de daños proactivo" } },
  "INT_RET_TRU_02_B": { id: "INT_RET_TRU_02_B", signal: "RET_TRU_02", option: "B" as const, translations: { en: "personally apologize via executive", es: "disculparse personalmente a través de ejecutivo" } },
  "INT_RET_TRU_02_C": { id: "INT_RET_TRU_02_C", signal: "RET_TRU_02", option: "C" as const, translations: { en: "increase transparency in resolution", es: "aumentar transparencia en resolución" } },

  // ============================================================================
  // EXP (Expansion) - Growth Alignment
  // ============================================================================
  "INT_EXP_GRW_01_A": { id: "INT_EXP_GRW_01_A", signal: "EXP_GRW_01", option: "A" as const, translations: { en: "define upgrade paths", es: "definir rutas de mejora" } },
  "INT_EXP_GRW_01_B": { id: "INT_EXP_GRW_01_B", signal: "EXP_GRW_01", option: "B" as const, translations: { en: "introduce tiered product", es: "introducir producto escalonado" } },
  "INT_EXP_GRW_01_C": { id: "INT_EXP_GRW_01_C", signal: "EXP_GRW_01", option: "C" as const, translations: { en: "incentivize expansion", es: "incentivar expansión" } },
  "INT_EXP_GRW_02_A": { id: "INT_EXP_GRW_02_A", signal: "EXP_GRW_02", option: "A" as const, translations: { en: "run awareness campaigns", es: "ejecutar campañas de conciencia" } },
  "INT_EXP_GRW_02_B": { id: "INT_EXP_GRW_02_B", signal: "EXP_GRW_02", option: "B" as const, translations: { en: "offer training workshops", es: "ofrecer talleres de capacitación" } },
  "INT_EXP_GRW_02_C": { id: "INT_EXP_GRW_02_C", signal: "EXP_GRW_02", option: "C" as const, translations: { en: "implement usage-based alerts", es: "implementar alertas basadas en uso" } },

  // ============================================================================
  // EXP (Expansion) - Value Perception
  // ============================================================================
  "INT_EXP_VAL_01_A": { id: "INT_EXP_VAL_01_A", signal: "EXP_VAL_01", option: "A" as const, translations: { en: "present upgrade prompts", es: "presentar indicaciones de mejora" } },
  "INT_EXP_VAL_01_B": { id: "INT_EXP_VAL_01_B", signal: "EXP_VAL_01", option: "B" as const, translations: { en: "bundle features into tiers", es: "agrupar características en niveles" } },
  "INT_EXP_VAL_01_C": { id: "INT_EXP_VAL_01_C", signal: "EXP_VAL_01", option: "C" as const, translations: { en: "highlight incremental benefits", es: "destacar beneficios incrementales" } },
  "INT_EXP_VAL_02_A": { id: "INT_EXP_VAL_02_A", signal: "EXP_VAL_02", option: "A" as const, translations: { en: "co-create business cases", es: "co-crear casos de negocio" } },
  "INT_EXP_VAL_02_B": { id: "INT_EXP_VAL_02_B", signal: "EXP_VAL_02", option: "B" as const, translations: { en: "perform benchmarking", es: "realizar evaluación comparativa" } },
  "INT_EXP_VAL_02_C": { id: "INT_EXP_VAL_02_C", signal: "EXP_VAL_02", option: "C" as const, translations: { en: "build ROI dashboards", es: "construir paneles de ROI" } },

  // ============================================================================
  // EXP (Expansion) - Relationship
  // ============================================================================
  "INT_EXP_REL_01_A": { id: "INT_EXP_REL_01_A", signal: "EXP_REL_01", option: "A" as const, translations: { en: "build relationship strategy", es: "construir estrategia de relación" } },
  "INT_EXP_REL_01_B": { id: "INT_EXP_REL_01_B", signal: "EXP_REL_01", option: "B" as const, translations: { en: "assign success manager", es: "asignar gerente de éxito" } },
  "INT_EXP_REL_01_C": { id: "INT_EXP_REL_01_C", signal: "EXP_REL_01", option: "C" as const, translations: { en: "maintain check-ins", es: "mantener registros de verificación" } },
  "INT_EXP_REL_02_A": { id: "INT_EXP_REL_02_A", signal: "EXP_REL_02", option: "A" as const, translations: { en: "launch advisory board", es: "lanzar junta asesora" } },
  "INT_EXP_REL_02_B": { id: "INT_EXP_REL_02_B", signal: "EXP_REL_02", option: "B" as const, translations: { en: "implement champion certification", es: "implementar certificación de campeón" } },
  "INT_EXP_REL_02_C": { id: "INT_EXP_REL_02_C", signal: "EXP_REL_02", option: "C" as const, translations: { en: "offer beta access", es: "ofrecer acceso beta" } }
} as const;

/**
 * Type extraction for intervention IDs - enables compile-time validation
 */
export type InterventionId = keyof typeof INTERVENTIONS;

/**
 * Type for a complete intervention definition
 */
export type Intervention = (typeof INTERVENTIONS)[InterventionId];

/**
 * Get intervention by ID with type safety
 * @returns Full intervention object or null if not found
 */
export function getIntervention(id: unknown): Intervention | null {
  if (typeof id !== "string" || !(id in INTERVENTIONS)) {
    return null;
  }
  return INTERVENTIONS[id as InterventionId];
}

/**
 * Type guard to validate intervention IDs at runtime
 */
export function validateInterventionId(id: unknown): id is InterventionId {
  return typeof id === "string" && id in INTERVENTIONS;
}

/**
 * Get intervention by ID or throw error if not found
 * For strict validation in critical paths
 */
export function getInterventionOrThrow(id: unknown): Intervention {
  const intervention = getIntervention(id);
  if (!intervention) {
    throw new Error(
      `Invalid intervention ID: ${id}. Must be a valid intervention from the registry.`
    );
  }
  return intervention;
}

/**
 * Get all interventions as an array
 */
export function getAllInterventions(): Intervention[] {
  return Object.values(INTERVENTIONS);
}

/**
 * Get interventions for a specific signal
 */
export function getInterventionsBySignal(signalId: string): Intervention[] {
  return getAllInterventions().filter((int) => int.signal === signalId);
}

/**
 * Get translation for an intervention by language
 */
export function getInterventionTranslation(
  id: unknown,
  language: "en" | "es"
): string | null {
  const intervention = getIntervention(id);
  return intervention?.translations[language] ?? null;
}

/**
 * Check if all interventions in a list are valid
 */
export function validateInterventionList(ids: unknown[]): ids is InterventionId[] {
  return Array.isArray(ids) && ids.every(validateInterventionId);
}

/**
 * Get statistics about the intervention registry
 */
export function getInterventionStats() {
  const all = getAllInterventions();
  const bySignal = new Map<string, number>();
  const byDomain = new Map<string, number>();

  for (const intervention of all) {
    bySignal.set(intervention.signal, (bySignal.get(intervention.signal) ?? 0) + 1);
    const domain = intervention.signal.split("_")[0];
    byDomain.set(domain, (byDomain.get(domain) ?? 0) + 1);
  }

  return {
    totalInterventions: all.length,
    totalSignals: bySignal.size,
    totalDomains: byDomain.size,
    bySignal: Object.fromEntries(bySignal),
    byDomain: Object.fromEntries(byDomain),
  };
}
