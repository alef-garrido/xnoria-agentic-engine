/**
 * translations.ts - Bilingual Translation Mapping (Phase 2)
 * 
 * RFC: CX Diagnostic Compass Architecture Refactoring
 * 
 * This file contains all translations for both English and Spanish.
 * Keys are organized hierarchically for easy navigation and maintenance:
 * 
 * - center.* - Central hub labels
 * - domain.* - Domain (stage) names
 * - cause.* - Cause structure (domain.cause format)
 * - signal.* - Signal/pain point names
 * - indicator.* - Key metric indicator names
 * 
 * Adding a new language is as simple as adding a new language object.
 * No data structure changes needed.
 */

export const TRANSLATIONS = {
  // ========================================================================
  // CENTER (CX HEALTH)
  // ========================================================================
  "en": {
    "center.cx_health": "CX Health",
    "center.cx_health_description": "Overall health of the customer experience.",

    // ========================================================================
    // DOMAINS
    // ========================================================================
    "domain.acquisition": "Acquisition",
    "domain.sales": "Sales Experience",
    "domain.onboarding": "Onboarding",
    "domain.product": "Product Experience",
    "domain.support": "Support & Service",
    "domain.communication": "Communication & Engagement",
    "domain.retention": "Retention & Loyalty",
    "domain.expansion": "Expansion",

    // ========================================================================
    // CAUSES - ACQ (ACQUISITION)
    // ========================================================================
    "cause.acq.vis": "Visibility",
    "cause.acq.clr": "Clarity",
    "cause.acq.tru": "Trust",

    // ========================================================================
    // SIGNALS - ACQ (ACQUISITION)
    // ========================================================================
    "signal.acq_vis_01": "low awareness",
    "signal.acq_vis_02": "low traffic",
    "signal.acq_clr_01": "customer confusion",
    "signal.acq_clr_02": "high bounce rate",
    "signal.acq_tru_01": "abandoned carts",
    "signal.acq_tru_02": "hesitation to buy",

    // ========================================================================
    // INDICATORS - ACQ (ACQUISITION)
    // ========================================================================
    "indicator.acq_vis_01_sv": "brand_search_volume",
    "indicator.acq_vis_02_sv": "site_visitors",
    "indicator.acq_clr_01_br": "bounce_rate",
    "indicator.acq_clr_02_ts": "time_on_site",
    "indicator.acq_tru_01_cr": "cart_abandonment_rate",
    "indicator.acq_tru_02_sc": "social_proof_clicks",

    // ========================================================================
    // CAUSES - SAL (SALES EXPERIENCE)
    // ========================================================================
    "cause.sal.clr": "Clarity",
    "cause.sal.val": "Value Perception",
    "cause.sal.tru": "Trust",

    // ========================================================================
    // SIGNALS - SAL (SALES EXPERIENCE)
    // ========================================================================
    "signal.sal_clr_01": "misunderstanding offering",
    "signal.sal_clr_02": "unclear pricing",
    "signal.sal_val_01": "price objections",
    "signal.sal_val_02": "weak conversion",
    "signal.sal_tru_01": "skepticism during demo",
    "signal.sal_tru_02": "lost to competitors",

    // ========================================================================
    // INDICATORS - SAL (SALES EXPERIENCE)
    // ========================================================================
    "indicator.sal_clr_01_dr": "demo_to_close_rate",
    "indicator.sal_clr_02_dr": "demo_to_close_rate",
    "indicator.sal_val_01_wr": "win_loss_ratio",
    "indicator.sal_val_02_wr": "win_loss_ratio",
    "indicator.sal_tru_01_cw": "competitive_win_rate",
    "indicator.sal_tru_02_cw": "competitive_win_rate",

    // ========================================================================
    // CAUSES - ONB (ONBOARDING)
    // ========================================================================
    "cause.onb.frc": "Friction",
    "cause.onb.clr": "Clarity",
    "cause.onb.cap": "Capability",

    // ========================================================================
    // SIGNALS - ONB (ONBOARDING)
    // ========================================================================
    "signal.onb_frc_01": "abandoned setup",
    "signal.onb_frc_02": "complaints about effort",
    "signal.onb_clr_01": "users confused about next steps",
    "signal.onb_cap_01": "unable to complete setup",
    "signal.onb_cap_02": "technical blockers",

    // ========================================================================
    // INDICATORS - ONB (ONBOARDING)
    // ========================================================================
    "indicator.onb_frc_01_tv": "time_to_first_value",
    "indicator.onb_frc_02_dr": "drop_off_rate",
    "indicator.onb_clr_01_hv": "help_article_views_in_onboarding",
    "indicator.onb_cap_01_cr": "onboarding_completion_rate",
    "indicator.onb_cap_02_cr": "onboarding_completion_rate",

    // ========================================================================
    // CAUSES - PRD (PRODUCT EXPERIENCE)
    // ========================================================================
    "cause.prd.frc": "Friction",
    "cause.prd.cap": "Capability",
    "cause.prd.cst": "Consistency",

    // ========================================================================
    // SIGNALS - PRD (PRODUCT EXPERIENCE)
    // ========================================================================
    "signal.prd_frc_01": "task abandonment",
    "signal.prd_frc_02": "low usage of core features",
    "signal.prd_cap_01": "workarounds used",
    "signal.prd_cap_02": "feature requests",
    "signal.prd_cst_01": "variable performance",
    "signal.prd_cst_02": "bugs",

    // ========================================================================
    // INDICATORS - PRD (PRODUCT EXPERIENCE)
    // ========================================================================
    "indicator.prd_frc_01_fa": "feature_adoption_rate",
    "indicator.prd_frc_02_fa": "feature_adoption_rate",
    "indicator.prd_cap_01_fr": "feature_request_volume",
    "indicator.prd_cap_02_fr": "feature_request_volume",
    "indicator.prd_cst_01_ut": "uptime",
    "indicator.prd_cst_02_br": "bug_report_frequency",

    // ========================================================================
    // CAUSES - SUP (SUPPORT & SERVICE)
    // ========================================================================
    "cause.sup.res": "Responsiveness",
    "cause.sup.cap": "Capability",
    "cause.sup.cst": "Consistency",

    // ========================================================================
    // SIGNALS - SUP (SUPPORT & SERVICE)
    // ========================================================================
    "signal.sup_res_01": "long wait times",
    "signal.sup_res_02": "escalations",
    "signal.sup_cap_01": "unresolved issues",
    "signal.sup_cap_02": "repeated contacts",
    "signal.sup_cst_01": "conflicting answers",
    "signal.sup_cst_02": "agent roulette",

    // ========================================================================
    // INDICATORS - SUP (SUPPORT & SERVICE)
    // ========================================================================
    "indicator.sup_res_01_fr": "first_response_time",
    "indicator.sup_res_02_rt": "resolution_time",
    "indicator.sup_cap_01_fc": "first_contact_resolution",
    "indicator.sup_cap_02_fc": "first_contact_resolution",
    "indicator.sup_cst_01_cv": "CSAT_variance",
    "indicator.sup_cst_02_cv": "CSAT_variance",

    // ========================================================================
    // CAUSES - COM (COMMUNICATION & ENGAGEMENT)
    // ========================================================================
    "cause.com.rel": "Relationship",
    "cause.com.res": "Responsiveness",
    "cause.com.cst": "Consistency",

    // ========================================================================
    // SIGNALS - COM (COMMUNICATION & ENGAGEMENT)
    // ========================================================================
    "signal.com_rel_01": "unsubscribed emails",
    "signal.com_rel_02": "low engagement",
    "signal.com_res_01": "ignored feedback",
    "signal.com_res_02": "one-way communication",
    "signal.com_cst_01": "mixed messaging",
    "signal.com_cst_02": "off-brand interactions",

    // ========================================================================
    // INDICATORS - COM (COMMUNICATION & ENGAGEMENT)
    // ========================================================================
    "indicator.com_rel_01_eo": "email_open_rate",
    "indicator.com_rel_02_ca": "community_activity",
    "indicator.com_res_01_sr": "survey_response_rate",
    "indicator.com_res_02_sr": "survey_response_rate",
    "indicator.com_cst_01_bs": "brand_sentiment",
    "indicator.com_cst_02_bs": "brand_sentiment",

    // ========================================================================
    // CAUSES - RET (RETENTION & LOYALTY)
    // ========================================================================
    "cause.ret.val": "Value Perception",
    "cause.ret.rel": "Relationship",
    "cause.ret.tru": "Trust",

    // ========================================================================
    // SIGNALS - RET (RETENTION & LOYALTY)
    // ========================================================================
    "signal.ret_val_01": "downgrades",
    "signal.ret_val_02": "churn to cheaper option",
    "signal.ret_rel_01": "silent churners",
    "signal.ret_rel_02": "no relationship with account manager",
    "signal.ret_tru_01": "broken promises",
    "signal.ret_tru_02": "reputational damage",

    // ========================================================================
    // INDICATORS - RET (RETENTION & LOYALTY)
    // ========================================================================
    "indicator.ret_val_01_nr": "net_revenue_retention",
    "indicator.ret_val_02_dr": "downgrade_rate",
    "indicator.ret_rel_01_hs": "health_score",
    "indicator.ret_rel_02_np": "NPS",
    "indicator.ret_tru_01_rr": "renewal_rate",
    "indicator.ret_tru_02_rr": "renewal_rate",

    // ========================================================================
    // CAUSES - EXP (EXPANSION)
    // ========================================================================
    "cause.exp.grw": "Growth Alignment",
    "cause.exp.val": "Value Perception",
    "cause.exp.rel": "Relationship",

    // ========================================================================
    // SIGNALS - EXP (EXPANSION)
    // ========================================================================
    "signal.exp_grw_01": "using competitors for other needs",
    "signal.exp_grw_02": "stagnant usage",
    "signal.exp_val_01": "unwillingness to pay more",
    "signal.exp_val_02": "low ROI perception",
    "signal.exp_rel_01": "blockers at executive level",
    "signal.exp_rel_02": "lack of champions",

    // ========================================================================
    // INDICATORS - EXP (EXPANSION)
    // ========================================================================
    "indicator.exp_grw_01_cs": "cross_sell_rate",
    "indicator.exp_grw_02_ua": "upsell_attempts",
    "indicator.exp_val_01_er": "expansion_revenue",
    "indicator.exp_val_02_er": "expansion_revenue",
    "indicator.exp_rel_01_na": "number_of_advocates",
    "indicator.exp_rel_02_na": "number_of_advocates",
  },

  // ========================================================================
  // SPANISH TRANSLATIONS
  // ========================================================================
  "es": {
    "center.cx_health": "Salud CX",
    "center.cx_health_description": "Salud general de la experiencia del cliente.",

    // ========================================================================
    // DOMAINS
    // ========================================================================
    "domain.acquisition": "Adquisición",
    "domain.sales": "Experiencia de Ventas",
    "domain.onboarding": "Incorporación",
    "domain.product": "Experiencia del Producto",
    "domain.support": "Soporte y Servicio",
    "domain.communication": "Comunicación e Interacción",
    "domain.retention": "Retención y Lealtad",
    "domain.expansion": "Expansión",

    // ========================================================================
    // CAUSES - ACQ (ACQUISITION)
    // ========================================================================
    "cause.acq.vis": "Visibilidad",
    "cause.acq.clr": "Claridad",
    "cause.acq.tru": "Confianza",

    // ========================================================================
    // SIGNALS - ACQ (ACQUISITION)
    // ========================================================================
    "signal.acq_vis_01": "baja concientización",
    "signal.acq_vis_02": "poco tráfico",
    "signal.acq_clr_01": "confusión del cliente",
    "signal.acq_clr_02": "tasa alta de rebote",
    "signal.acq_tru_01": "carritos abandonados",
    "signal.acq_tru_02": "vacilación para comprar",

    // ========================================================================
    // INDICATORS - ACQ (ACQUISITION)
    // ========================================================================
    "indicator.acq_vis_01_sv": "volumen_búsqueda_marca",
    "indicator.acq_vis_02_sv": "visitantes_sitio",
    "indicator.acq_clr_01_br": "tasa_de_rebote",
    "indicator.acq_clr_02_ts": "tiempo_en_sitio",
    "indicator.acq_tru_01_cr": "tasa_abandono_carrito",
    "indicator.acq_tru_02_sc": "clics_prueba_social",

    // ========================================================================
    // CAUSES - SAL (SALES EXPERIENCE)
    // ========================================================================
    "cause.sal.clr": "Claridad",
    "cause.sal.val": "Percepción de Valor",
    "cause.sal.tru": "Confianza",

    // ========================================================================
    // SIGNALS - SAL (SALES EXPERIENCE)
    // ========================================================================
    "signal.sal_clr_01": "malinterpretación de la oferta",
    "signal.sal_clr_02": "precios poco claros",
    "signal.sal_val_01": "objeciones de precio",
    "signal.sal_val_02": "conversión débil",
    "signal.sal_tru_01": "escepticismo durante la demostración",
    "signal.sal_tru_02": "perdido a competidores",

    // ========================================================================
    // INDICATORS - SAL (SALES EXPERIENCE)
    // ========================================================================
    "indicator.sal_clr_01_dr": "tasa_demo_cierre",
    "indicator.sal_clr_02_dr": "tasa_demo_cierre",
    "indicator.sal_val_01_wr": "proporción_ganancias_pérdidas",
    "indicator.sal_val_02_wr": "proporción_ganancias_pérdidas",
    "indicator.sal_tru_01_cw": "tasa_ganancias_competitivas",
    "indicator.sal_tru_02_cw": "tasa_ganancias_competitivas",

    // ========================================================================
    // CAUSES - ONB (ONBOARDING)
    // ========================================================================
    "cause.onb.frc": "Fricción",
    "cause.onb.clr": "Claridad",
    "cause.onb.cap": "Capacidad",

    // ========================================================================
    // SIGNALS - ONB (ONBOARDING)
    // ========================================================================
    "signal.onb_frc_01": "configuración abandonada",
    "signal.onb_frc_02": "quejas sobre esfuerzo",
    "signal.onb_clr_01": "usuarios confundidos sobre próximos pasos",
    "signal.onb_cap_01": "incapaz de completar la configuración",
    "signal.onb_cap_02": "obstáculos técnicos",

    // ========================================================================
    // INDICATORS - ONB (ONBOARDING)
    // ========================================================================
    "indicator.onb_frc_01_tv": "tiempo_primer_valor",
    "indicator.onb_frc_02_dr": "tasa_abandono",
    "indicator.onb_clr_01_hv": "vistas_articulos_ayuda_incorporacion",
    "indicator.onb_cap_01_cr": "tasa_completitud_incorporacion",
    "indicator.onb_cap_02_cr": "tasa_completitud_incorporacion",

    // ========================================================================
    // CAUSES - PRD (PRODUCT EXPERIENCE)
    // ========================================================================
    "cause.prd.frc": "Fricción",
    "cause.prd.cap": "Capacidad",
    "cause.prd.cst": "Consistencia",

    // ========================================================================
    // SIGNALS - PRD (PRODUCT EXPERIENCE)
    // ========================================================================
    "signal.prd_frc_01": "abandono de tareas",
    "signal.prd_frc_02": "bajo uso de características principales",
    "signal.prd_cap_01": "se usan soluciones alternativas",
    "signal.prd_cap_02": "solicitudes de características",
    "signal.prd_cst_01": "rendimiento variable",
    "signal.prd_cst_02": "errores",

    // ========================================================================
    // INDICATORS - PRD (PRODUCT EXPERIENCE)
    // ========================================================================
    "indicator.prd_frc_01_fa": "tasa_adopcion_características",
    "indicator.prd_frc_02_fa": "tasa_adopcion_características",
    "indicator.prd_cap_01_fr": "volumen_solicitudes_características",
    "indicator.prd_cap_02_fr": "volumen_solicitudes_características",
    "indicator.prd_cst_01_ut": "disponibilidad",
    "indicator.prd_cst_02_br": "frecuencia_reportes_errores",

    // ========================================================================
    // CAUSES - SUP (SUPPORT & SERVICE)
    // ========================================================================
    "cause.sup.res": "Capacidad de Respuesta",
    "cause.sup.cap": "Capacidad",
    "cause.sup.cst": "Consistencia",

    // ========================================================================
    // SIGNALS - SUP (SUPPORT & SERVICE)
    // ========================================================================
    "signal.sup_res_01": "tiempos de espera largos",
    "signal.sup_res_02": "escalaciones",
    "signal.sup_cap_01": "problemas sin resolver",
    "signal.sup_cap_02": "contactos repetidos",
    "signal.sup_cst_01": "respuestas conflictivas",
    "signal.sup_cst_02": "ruleta de agentes",

    // ========================================================================
    // INDICATORS - SUP (SUPPORT & SERVICE)
    // ========================================================================
    "indicator.sup_res_01_fr": "tiempo_primera_respuesta",
    "indicator.sup_res_02_rt": "tiempo_resolucion",
    "indicator.sup_cap_01_fc": "resolucion_primer_contacto",
    "indicator.sup_cap_02_fc": "resolucion_primer_contacto",
    "indicator.sup_cst_01_cv": "varianza_CSAT",
    "indicator.sup_cst_02_cv": "varianza_CSAT",

    // ========================================================================
    // CAUSES - COM (COMMUNICATION & ENGAGEMENT)
    // ========================================================================
    "cause.com.rel": "Relación",
    "cause.com.res": "Capacidad de Respuesta",
    "cause.com.cst": "Consistencia",

    // ========================================================================
    // SIGNALS - COM (COMMUNICATION & ENGAGEMENT)
    // ========================================================================
    "signal.com_rel_01": "correos electrónicos cancelados",
    "signal.com_rel_02": "bajo compromiso",
    "signal.com_res_01": "retroalimentación ignorada",
    "signal.com_res_02": "comunicación unidireccional",
    "signal.com_cst_01": "mensajes mixtos",
    "signal.com_cst_02": "interacciones fuera de marca",

    // ========================================================================
    // INDICATORS - COM (COMMUNICATION & ENGAGEMENT)
    // ========================================================================
    "indicator.com_rel_01_eo": "tasa_apertura_email",
    "indicator.com_rel_02_ca": "actividad_comunidad",
    "indicator.com_res_01_sr": "tasa_respuesta_encuesta",
    "indicator.com_res_02_sr": "tasa_respuesta_encuesta",
    "indicator.com_cst_01_bs": "sentimiento_marca",
    "indicator.com_cst_02_bs": "sentimiento_marca",

    // ========================================================================
    // CAUSES - RET (RETENTION & LOYALTY)
    // ========================================================================
    "cause.ret.val": "Percepción de Valor",
    "cause.ret.rel": "Relación",
    "cause.ret.tru": "Confianza",

    // ========================================================================
    // SIGNALS - RET (RETENTION & LOYALTY)
    // ========================================================================
    "signal.ret_val_01": "downgrade",
    "signal.ret_val_02": "abandono a opción más barata",
    "signal.ret_rel_01": "clientes silenciosos que nos abandonan",
    "signal.ret_rel_02": "sin relación con gerente de cuenta",
    "signal.ret_tru_01": "promesas incumplidas",
    "signal.ret_tru_02": "daño reputacional",

    // ========================================================================
    // INDICATORS - RET (RETENTION & LOYALTY)
    // ========================================================================
    "indicator.ret_val_01_nr": "retención_ingresos_netos",
    "indicator.ret_val_02_dr": "tasa_downgrades",
    "indicator.ret_rel_01_hs": "puntuacion_salud",
    "indicator.ret_rel_02_np": "NPS",
    "indicator.ret_tru_01_rr": "tasa_renovacion",
    "indicator.ret_tru_02_rr": "tasa_renovacion",

    // ========================================================================
    // CAUSES - EXP (EXPANSION)
    // ========================================================================
    "cause.exp.grw": "Alineación de Crecimiento",
    "cause.exp.val": "Percepción de Valor",
    "cause.exp.rel": "Relación",

    // ========================================================================
    // SIGNALS - EXP (EXPANSION)
    // ========================================================================
    "signal.exp_grw_01": "usar competidores para otras necesidades",
    "signal.exp_grw_02": "uso estancado",
    "signal.exp_val_01": "falta de disposición a pagar más",
    "signal.exp_val_02": "baja percepción de ROI",
    "signal.exp_rel_01": "obstáculos a nivel ejecutivo",
    "signal.exp_rel_02": "falta de promotores",

    // ========================================================================
    // INDICATORS - EXP (EXPANSION)
    // ========================================================================
    "indicator.exp_grw_01_cs": "tasa_venta_cruzada",
    "indicator.exp_grw_02_ua": "intentos_venta_adicional",
    "indicator.exp_val_01_er": "ingresos_expansion",
    "indicator.exp_val_02_er": "ingresos_expansion",
    "indicator.exp_rel_01_na": "numero_defensores",
    "indicator.exp_rel_02_na": "numero_defensores",
  },
} as const;

// Type definitions for type-safe access
export type Language = keyof typeof TRANSLATIONS;
export type TranslationKey = keyof (typeof TRANSLATIONS)["en"];

/**
 * Get translation for a given key and language
 * Returns the key itself if translation not found (fallback)
 */
export function translate(
  key: TranslationKey,
  language: Language = "en"
): string {
  return (
    (TRANSLATIONS[language][key] as string | undefined) ||
    (TRANSLATIONS.en[key] as string | undefined) ||
    key
  );
}

/**
 * Get all keys for a given prefix
 * Useful for finding related translations
 */
export function getTranslationsByPrefix(
  prefix: string,
  language: Language = "en"
): Record<string, string> {
  const result: Record<string, string> = {};
  const translations = TRANSLATIONS[language];

  for (const [key, value] of Object.entries(translations)) {
    if ((key as string).startsWith(prefix)) {
      result[key as string] = value;
    }
  }

  return result;
}

/**
 * Validate that all keys in English have translations in other languages
 * Useful for CI/CD to catch missing translations
 */
export function validateTranslationCompleteness(): {
  valid: boolean;
  missingTranslations: {
    language: Language;
    keys: TranslationKey[];
  }[];
} {
  const enKeys = new Set(Object.keys(TRANSLATIONS.en) as TranslationKey[]);
  const missingTranslations: {
    language: Language;
    keys: TranslationKey[];
  }[] = [];

  for (const [lang, translations] of Object.entries(TRANSLATIONS)) {
    if (lang === "en") continue; // Skip English source

    const langKeys = new Set(Object.keys(translations));
    const missing = Array.from(enKeys).filter(
      (key) => !langKeys.has(key as string)
    );

    if (missing.length > 0) {
      missingTranslations.push({
        language: lang as Language,
        keys: missing,
      });
    }
  }

  return {
    valid: missingTranslations.length === 0,
    missingTranslations,
  };
}
