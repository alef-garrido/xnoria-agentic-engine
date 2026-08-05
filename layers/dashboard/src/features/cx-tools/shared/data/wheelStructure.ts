/**
 * wheelStructure.ts - Pure Data Structure (Phase 2)
 *
 * RFC: CX Diagnostic Compass Architecture Refactoring
 *
 * This file contains the data structure without any hardcoded strings.
 * All text (domain names, cause names, signal names, indicators) are replaced
 * with translation keys that map to actual translations in translations.ts
 *
 * Benefits:
 * - Single source of truth for data structure
 * - Easy to add new languages (only add to translations.ts)
 * - Type-safe intervention references (validated by interventionRegistry)
 * - No data duplication (aggregates computed on-demand in Phase 5)
 * - Clear separation between data and translations
 */

import type { WheelData } from "@/features/cx-tools/shared/types/wheel";
import { translate, type Language } from "@/features/cx-tools/shared/i18n/translations";

export const WHEEL_STRUCTURE = {
  // Central hub
  center: {
    id: "cx_health",
    name_key: "center.cx_health",
    description_key: "center.cx_health_description",
  },

  // All domains
  domains: [
    // ========================================================================
    // ACQ - ACQUISITION
    // ========================================================================
    {
      id: "acquisition",
      code: "ACQ",
      name_key: "domain.acquisition",
      color: "#3A86FF",
      causes: [
        {
          id: "vis",
          code: "VIS",
          name_key: "cause.acq.vis",
          signals: [
            {
              id: "ACQ_VIS_01",
              name_key: "signal.acq_vis_01",
              severity: 0.8,
              level: 2,
              indicators: [{ id: "ACQ_VIS_01_SV", name_key: "indicator.acq_vis_01_sv" }],
              intervention_ids: [
                "INT_ACQ_VIS_01_A",
                "INT_ACQ_VIS_01_B",
                "INT_ACQ_VIS_01_C",
              ] as const,
            },
            {
              id: "ACQ_VIS_02",
              name_key: "signal.acq_vis_02",
              severity: 0.9,
              level: 3,
              indicators: [{ id: "ACQ_VIS_02_SV", name_key: "indicator.acq_vis_02_sv" }],
              intervention_ids: [
                "INT_ACQ_VIS_02_A",
                "INT_ACQ_VIS_02_B",
                "INT_ACQ_VIS_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "clr",
          code: "CLR",
          name_key: "cause.acq.clr",
          signals: [
            {
              id: "ACQ_CLR_01",
              name_key: "signal.acq_clr_01",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "ACQ_CLR_01_BR", name_key: "indicator.acq_clr_01_br" }],
              intervention_ids: [
                "INT_ACQ_CLR_01_A",
                "INT_ACQ_CLR_01_B",
                "INT_ACQ_CLR_01_C",
              ] as const,
            },
            {
              id: "ACQ_CLR_02",
              name_key: "signal.acq_clr_02",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "ACQ_CLR_02_TS", name_key: "indicator.acq_clr_02_ts" }],
              intervention_ids: [
                "INT_ACQ_CLR_02_A",
                "INT_ACQ_CLR_02_B",
                "INT_ACQ_CLR_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "tru",
          code: "TRU",
          name_key: "cause.acq.tru",
          signals: [
            {
              id: "ACQ_TRU_01",
              name_key: "signal.acq_tru_01",
              severity: 0.5,
              level: 3,
              indicators: [{ id: "ACQ_TRU_01_CR", name_key: "indicator.acq_tru_01_cr" }],
              intervention_ids: [
                "INT_ACQ_TRU_01_A",
                "INT_ACQ_TRU_01_B",
                "INT_ACQ_TRU_01_C",
              ] as const,
            },
            {
              id: "ACQ_TRU_02",
              name_key: "signal.acq_tru_02",
              severity: 0.6,
              level: 0,
              indicators: [{ id: "ACQ_TRU_02_SC", name_key: "indicator.acq_tru_02_sc" }],
              intervention_ids: [
                "INT_ACQ_TRU_02_A",
                "INT_ACQ_TRU_02_B",
                "INT_ACQ_TRU_02_C",
              ] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // SAL - SALES EXPERIENCE
    // ========================================================================
    {
      id: "sales",
      code: "SAL",
      name_key: "domain.sales",
      color: "#8338EC",
      causes: [
        {
          id: "clr",
          code: "CLR",
          name_key: "cause.sal.clr",
          signals: [
            {
              id: "SAL_CLR_01",
              name_key: "signal.sal_clr_01",
              severity: 0.8,
              level: 0,
              indicators: [{ id: "SAL_CLR_01_DR", name_key: "indicator.sal_clr_01_dr" }],
              intervention_ids: [
                "INT_SAL_CLR_01_A",
                "INT_SAL_CLR_01_B",
                "INT_SAL_CLR_01_C",
              ] as const,
            },
            {
              id: "SAL_CLR_02",
              name_key: "signal.sal_clr_02",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "SAL_CLR_02_DR", name_key: "indicator.sal_clr_02_dr" }],
              intervention_ids: [
                "INT_SAL_CLR_02_A",
                "INT_SAL_CLR_02_B",
                "INT_SAL_CLR_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "val",
          code: "VAL",
          name_key: "cause.sal.val",
          signals: [
            {
              id: "SAL_VAL_01",
              name_key: "signal.sal_val_01",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "SAL_VAL_01_WR", name_key: "indicator.sal_val_01_wr" }],
              intervention_ids: [
                "INT_SAL_VAL_01_A",
                "INT_SAL_VAL_01_B",
                "INT_SAL_VAL_01_C",
              ] as const,
            },
            {
              id: "SAL_VAL_02",
              name_key: "signal.sal_val_02",
              severity: 0.5,
              level: 3,
              indicators: [{ id: "SAL_VAL_02_WR", name_key: "indicator.sal_val_02_wr" }],
              intervention_ids: [
                "INT_SAL_VAL_02_A",
                "INT_SAL_VAL_02_B",
                "INT_SAL_VAL_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "tru",
          code: "TRU",
          name_key: "cause.sal.tru",
          signals: [
            {
              id: "SAL_TRU_01",
              name_key: "signal.sal_tru_01",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "SAL_TRU_01_CW", name_key: "indicator.sal_tru_01_cw" }],
              intervention_ids: [
                "INT_SAL_TRU_01_A",
                "INT_SAL_TRU_01_B",
                "INT_SAL_TRU_01_C",
              ] as const,
            },
            {
              id: "SAL_TRU_02",
              name_key: "signal.sal_tru_02",
              severity: 0.5,
              level: 3,
              indicators: [{ id: "SAL_TRU_02_CW", name_key: "indicator.sal_tru_02_cw" }],
              intervention_ids: [
                "INT_SAL_TRU_02_A",
                "INT_SAL_TRU_02_B",
                "INT_SAL_TRU_02_C",
              ] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // ONB - ONBOARDING
    // ========================================================================
    {
      id: "onboarding",
      code: "ONB",
      name_key: "domain.onboarding",
      color: "#06D6A0",
      causes: [
        {
          id: "frc",
          code: "FRC",
          name_key: "cause.onb.frc",
          signals: [
            {
              id: "ONB_FRC_01",
              name_key: "signal.onb_frc_01",
              severity: 0.7,
              level: 1,
              indicators: [{ id: "ONB_FRC_01_TV", name_key: "indicator.onb_frc_01_tv" }],
              intervention_ids: [
                "INT_ONB_FRC_01_A",
                "INT_ONB_FRC_01_B",
                "INT_ONB_FRC_01_C",
              ] as const,
            },
            {
              id: "ONB_FRC_02",
              name_key: "signal.onb_frc_02",
              severity: 0.8,
              level: 2,
              indicators: [{ id: "ONB_FRC_02_DR", name_key: "indicator.onb_frc_02_dr" }],
              intervention_ids: [
                "INT_ONB_FRC_02_A",
                "INT_ONB_FRC_02_B",
                "INT_ONB_FRC_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "clr",
          code: "CLR",
          name_key: "cause.onb.clr",
          signals: [
            {
              id: "ONB_CLR_01",
              name_key: "signal.onb_clr_01",
              severity: 0.7,
              level: 3,
              indicators: [{ id: "ONB_CLR_01_HV", name_key: "indicator.onb_clr_01_hv" }],
              intervention_ids: [
                "INT_ONB_CLR_01_A",
                "INT_ONB_CLR_01_B",
                "INT_ONB_CLR_01_C",
              ] as const,
            },
          ],
        },
        {
          id: "cap",
          code: "CAP",
          name_key: "cause.onb.cap",
          signals: [
            {
              id: "ONB_CAP_01",
              name_key: "signal.onb_cap_01",
              severity: 0.6,
              level: 2,
              indicators: [{ id: "ONB_CAP_01_CR", name_key: "indicator.onb_cap_01_cr" }],
              intervention_ids: [
                "INT_ONB_CAP_01_A",
                "INT_ONB_CAP_01_B",
                "INT_ONB_CAP_01_C",
              ] as const,
            },
            {
              id: "ONB_CAP_02",
              name_key: "signal.onb_cap_02",
              severity: 0.7,
              level: 3,
              indicators: [{ id: "ONB_CAP_02_CR", name_key: "indicator.onb_cap_02_cr" }],
              intervention_ids: [] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // PRD - PRODUCT EXPERIENCE
    // ========================================================================
    {
      id: "product",
      code: "PRD",
      name_key: "domain.product",
      color: "#118AB2",
      causes: [
        {
          id: "frc",
          code: "FRC",
          name_key: "cause.prd.frc",
          signals: [
            {
              id: "PRD_FRC_01",
              name_key: "signal.prd_frc_01",
              severity: 0.8,
              level: 0,
              indicators: [{ id: "PRD_FRC_01_FA", name_key: "indicator.prd_frc_01_fa" }],
              intervention_ids: [
                "INT_PRD_FRC_01_A",
                "INT_PRD_FRC_01_B",
                "INT_PRD_FRC_01_C",
              ] as const,
            },
            {
              id: "PRD_FRC_02",
              name_key: "signal.prd_frc_02",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "PRD_FRC_02_FA", name_key: "indicator.prd_frc_02_fa" }],
              intervention_ids: [
                "INT_PRD_FRC_02_A",
                "INT_PRD_FRC_02_B",
                "INT_PRD_FRC_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "cap",
          code: "CAP",
          name_key: "cause.prd.cap",
          signals: [
            {
              id: "PRD_CAP_01",
              name_key: "signal.prd_cap_01",
              severity: 0.7,
              level: 1,
              indicators: [{ id: "PRD_CAP_01_FR", name_key: "indicator.prd_cap_01_fr" }],
              intervention_ids: [
                "INT_PRD_CAP_01_A",
                "INT_PRD_CAP_01_B",
                "INT_PRD_CAP_01_C",
              ] as const,
            },
            {
              id: "PRD_CAP_02",
              name_key: "signal.prd_cap_02",
              severity: 0.8,
              level: 2,
              indicators: [{ id: "PRD_CAP_02_FR", name_key: "indicator.prd_cap_02_fr" }],
              intervention_ids: [
                "INT_PRD_CAP_02_A",
                "INT_PRD_CAP_02_B",
                "INT_PRD_CAP_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "cst",
          code: "CST",
          name_key: "cause.prd.cst",
          signals: [
            {
              id: "PRD_CST_01",
              name_key: "signal.prd_cst_01",
              severity: 0.5,
              level: 3,
              indicators: [{ id: "PRD_CST_01_UT", name_key: "indicator.prd_cst_01_ut" }],
              intervention_ids: [
                "INT_PRD_CST_01_A",
                "INT_PRD_CST_01_B",
                "INT_PRD_CST_01_C",
              ] as const,
            },
            {
              id: "PRD_CST_02",
              name_key: "signal.prd_cst_02",
              severity: 0.6,
              level: 0,
              indicators: [{ id: "PRD_CST_02_BR", name_key: "indicator.prd_cst_02_br" }],
              intervention_ids: [
                "INT_PRD_CST_02_A",
                "INT_PRD_CST_02_B",
                "INT_PRD_CST_02_C",
              ] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // SUP - SUPPORT & SERVICE
    // ========================================================================
    {
      id: "support",
      code: "SUP",
      name_key: "domain.support",
      color: "#FF9F1C",
      causes: [
        {
          id: "res",
          code: "RES",
          name_key: "cause.sup.res",
          signals: [
            {
              id: "SUP_RES_01",
              name_key: "signal.sup_res_01",
              severity: 0.5,
              level: 1,
              indicators: [{ id: "SUP_RES_01_FR", name_key: "indicator.sup_res_01_fr" }],
              intervention_ids: [
                "INT_SUP_RES_01_A",
                "INT_SUP_RES_01_B",
                "INT_SUP_RES_01_C",
              ] as const,
            },
            {
              id: "SUP_RES_02",
              name_key: "signal.sup_res_02",
              severity: 0.6,
              level: 2,
              indicators: [{ id: "SUP_RES_02_RT", name_key: "indicator.sup_res_02_rt" }],
              intervention_ids: [
                "INT_SUP_RES_02_A",
                "INT_SUP_RES_02_B",
                "INT_SUP_RES_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "cap",
          code: "CAP",
          name_key: "cause.sup.cap",
          signals: [
            {
              id: "SUP_CAP_01",
              name_key: "signal.sup_cap_01",
              severity: 0.7,
              level: 3,
              indicators: [{ id: "SUP_CAP_01_FC", name_key: "indicator.sup_cap_01_fc" }],
              intervention_ids: [
                "INT_SUP_CAP_01_A",
                "INT_SUP_CAP_01_B",
                "INT_SUP_CAP_01_C",
              ] as const,
            },
            {
              id: "SUP_CAP_02",
              name_key: "signal.sup_cap_02",
              severity: 0.8,
              level: 0,
              indicators: [{ id: "SUP_CAP_02_FC", name_key: "indicator.sup_cap_02_fc" }],
              intervention_ids: [
                "INT_SUP_CAP_02_A",
                "INT_SUP_CAP_02_B",
                "INT_SUP_CAP_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "cst",
          code: "CST",
          name_key: "cause.sup.cst",
          signals: [
            {
              id: "SUP_CST_01",
              name_key: "signal.sup_cst_01",
              severity: 0.5,
              level: 1,
              indicators: [{ id: "SUP_CST_01_CV", name_key: "indicator.sup_cst_01_cv" }],
              intervention_ids: [
                "INT_SUP_CST_01_A",
                "INT_SUP_CST_01_B",
                "INT_SUP_CST_01_C",
              ] as const,
            },
            {
              id: "SUP_CST_02",
              name_key: "signal.sup_cst_02",
              severity: 0.6,
              level: 2,
              indicators: [{ id: "SUP_CST_02_CV", name_key: "indicator.sup_cst_02_cv" }],
              intervention_ids: [
                "INT_SUP_CST_02_A",
                "INT_SUP_CST_02_B",
                "INT_SUP_CST_02_C",
              ] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // COM - COMMUNICATION & ENGAGEMENT
    // ========================================================================
    {
      id: "communication",
      code: "COM",
      name_key: "domain.communication",
      color: "#F72585",
      causes: [
        {
          id: "rel",
          code: "REL",
          name_key: "cause.com.rel",
          signals: [
            {
              id: "COM_REL_01",
              name_key: "signal.com_rel_01",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "COM_REL_01_EO", name_key: "indicator.com_rel_01_eo" }],
              intervention_ids: [
                "INT_COM_REL_01_A",
                "INT_COM_REL_01_B",
                "INT_COM_REL_01_C",
              ] as const,
            },
            {
              id: "COM_REL_02",
              name_key: "signal.com_rel_02",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "COM_REL_02_CA", name_key: "indicator.com_rel_02_ca" }],
              intervention_ids: [
                "INT_COM_REL_02_A",
                "INT_COM_REL_02_B",
                "INT_COM_REL_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "res",
          code: "RES",
          name_key: "cause.com.res",
          signals: [
            {
              id: "COM_RES_01",
              name_key: "signal.com_res_01",
              severity: 0.4,
              level: 0,
              indicators: [{ id: "COM_RES_01_SR", name_key: "indicator.com_res_01_sr" }],
              intervention_ids: [
                "INT_COM_RES_01_A",
                "INT_COM_RES_01_B",
                "INT_COM_RES_01_C",
              ] as const,
            },
            {
              id: "COM_RES_02",
              name_key: "signal.com_res_02",
              severity: 0.5,
              level: 1,
              indicators: [{ id: "COM_RES_02_SR", name_key: "indicator.com_res_02_sr" }],
              intervention_ids: [
                "INT_COM_RES_02_A",
                "INT_COM_RES_02_B",
                "INT_COM_RES_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "cst",
          code: "CST",
          name_key: "cause.com.cst",
          signals: [
            {
              id: "COM_CST_01",
              name_key: "signal.com_cst_01",
              severity: 0.4,
              level: 0,
              indicators: [{ id: "COM_CST_01_BS", name_key: "indicator.com_cst_01_bs" }],
              intervention_ids: [
                "INT_COM_CST_01_A",
                "INT_COM_CST_01_B",
                "INT_COM_CST_01_C",
              ] as const,
            },
            {
              id: "COM_CST_02",
              name_key: "signal.com_cst_02",
              severity: 0.5,
              level: 1,
              indicators: [{ id: "COM_CST_02_BS", name_key: "indicator.com_cst_02_bs" }],
              intervention_ids: [
                "INT_COM_CST_02_A",
                "INT_COM_CST_02_B",
                "INT_COM_CST_02_C",
              ] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // RET - RETENTION & LOYALTY
    // ========================================================================
    {
      id: "retention",
      code: "RET",
      name_key: "domain.retention",
      color: "#2EC4B6",
      causes: [
        {
          id: "val",
          code: "VAL",
          name_key: "cause.ret.val",
          signals: [
            {
              id: "RET_VAL_01",
              name_key: "signal.ret_val_01",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "RET_VAL_01_NR", name_key: "indicator.ret_val_01_nr" }],
              intervention_ids: [
                "INT_RET_VAL_01_A",
                "INT_RET_VAL_01_B",
                "INT_RET_VAL_01_C",
              ] as const,
            },
            {
              id: "RET_VAL_02",
              name_key: "signal.ret_val_02",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "RET_VAL_02_DR", name_key: "indicator.ret_val_02_dr" }],
              intervention_ids: [
                "INT_RET_VAL_02_A",
                "INT_RET_VAL_02_B",
                "INT_RET_VAL_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "rel",
          code: "REL",
          name_key: "cause.ret.rel",
          signals: [
            {
              id: "RET_REL_01",
              name_key: "signal.ret_rel_01",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "RET_REL_01_HS", name_key: "indicator.ret_rel_01_hs" }],
              intervention_ids: [
                "INT_RET_REL_01_A",
                "INT_RET_REL_01_B",
                "INT_RET_REL_01_C",
              ] as const,
            },
            {
              id: "RET_REL_02",
              name_key: "signal.ret_rel_02",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "RET_REL_02_NP", name_key: "indicator.ret_rel_02_np" }],
              intervention_ids: [
                "INT_RET_REL_02_A",
                "INT_RET_REL_02_B",
                "INT_RET_REL_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "tru",
          code: "TRU",
          name_key: "cause.ret.tru",
          signals: [
            {
              id: "RET_TRU_01",
              name_key: "signal.ret_tru_01",
              severity: 0.9,
              level: 1,
              indicators: [{ id: "RET_TRU_01_RR", name_key: "indicator.ret_tru_01_rr" }],
              intervention_ids: [
                "INT_RET_TRU_01_A",
                "INT_RET_TRU_01_B",
                "INT_RET_TRU_01_C",
              ] as const,
            },
            {
              id: "RET_TRU_02",
              name_key: "signal.ret_tru_02",
              severity: 0.4,
              level: 2,
              indicators: [{ id: "RET_TRU_02_RR", name_key: "indicator.ret_tru_02_rr" }],
              intervention_ids: [
                "INT_RET_TRU_02_A",
                "INT_RET_TRU_02_B",
                "INT_RET_TRU_02_C",
              ] as const,
            },
          ],
        },
      ],
    },

    // ========================================================================
    // EXP - EXPANSION
    // ========================================================================
    {
      id: "expansion",
      code: "EXP",
      name_key: "domain.expansion",
      color: "#EF476F",
      causes: [
        {
          id: "grw",
          code: "GRW",
          name_key: "cause.exp.grw",
          signals: [
            {
              id: "EXP_GRW_01",
              name_key: "signal.exp_grw_01",
              severity: 0.6,
              level: 0,
              indicators: [{ id: "EXP_GRW_01_CS", name_key: "indicator.exp_grw_01_cs" }],
              intervention_ids: [
                "INT_EXP_GRW_01_A",
                "INT_EXP_GRW_01_B",
                "INT_EXP_GRW_01_C",
              ] as const,
            },
            {
              id: "EXP_GRW_02",
              name_key: "signal.exp_grw_02",
              severity: 0.7,
              level: 1,
              indicators: [{ id: "EXP_GRW_02_UA", name_key: "indicator.exp_grw_02_ua" }],
              intervention_ids: [
                "INT_EXP_GRW_02_A",
                "INT_EXP_GRW_02_B",
                "INT_EXP_GRW_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "val",
          code: "VAL",
          name_key: "cause.exp.val",
          signals: [
            {
              id: "EXP_VAL_01",
              name_key: "signal.exp_val_01",
              severity: 0.5,
              level: 3,
              indicators: [{ id: "EXP_VAL_01_ER", name_key: "indicator.exp_val_01_er" }],
              intervention_ids: [
                "INT_EXP_VAL_01_A",
                "INT_EXP_VAL_01_B",
                "INT_EXP_VAL_01_C",
              ] as const,
            },
            {
              id: "EXP_VAL_02",
              name_key: "signal.exp_val_02",
              severity: 0.6,
              level: 0,
              indicators: [{ id: "EXP_VAL_02_ER", name_key: "indicator.exp_val_02_er" }],
              intervention_ids: [
                "INT_EXP_VAL_02_A",
                "INT_EXP_VAL_02_B",
                "INT_EXP_VAL_02_C",
              ] as const,
            },
          ],
        },
        {
          id: "rel",
          code: "REL",
          name_key: "cause.exp.rel",
          signals: [
            {
              id: "EXP_REL_01",
              name_key: "signal.exp_rel_01",
              severity: 0.5,
              level: 3,
              indicators: [{ id: "EXP_REL_01_NA", name_key: "indicator.exp_rel_01_na" }],
              intervention_ids: [
                "INT_EXP_REL_01_A",
                "INT_EXP_REL_01_B",
                "INT_EXP_REL_01_C",
              ] as const,
            },
            {
              id: "EXP_REL_02",
              name_key: "signal.exp_rel_02",
              severity: 0.6,
              level: 0,
              indicators: [{ id: "EXP_REL_02_NA", name_key: "indicator.exp_rel_02_na" }],
              intervention_ids: [
                "INT_EXP_REL_02_A",
                "INT_EXP_REL_02_B",
                "INT_EXP_REL_02_C",
              ] as const,
            },
          ],
        },
      ],
    },
  ],
} as const;

// Type definitions for type-safe access
export type WheelStructure = typeof WHEEL_STRUCTURE;
export type Domain = WheelStructure["domains"][number];
export type Cause = Domain["causes"][number];
export type Signal = Cause["signals"][number];
export type Indicator = Signal["indicators"][number];

/**
 * Helper function to get all signals from the structure
 * Useful for iteration and filtering operations
 */
export function getAllSignalsFromStructure(): Signal[] {
  const signals: Signal[] = [];
  for (const domain of WHEEL_STRUCTURE.domains) {
    for (const cause of domain.causes) {
      signals.push(...cause.signals);
    }
  }
  return signals;
}

/**
 * Helper function to find a signal by ID
 */
export function getSignalById(signalId: string): Signal | undefined {
  for (const domain of WHEEL_STRUCTURE.domains) {
    for (const cause of domain.causes) {
      const found = cause.signals.find((s) => s.id === signalId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Resolve the wheel data for a given language.
 * Replaces wheelDataEn (English-only) with a locale-aware build
 * sourced from WHEEL_STRUCTURE + translations.ts.
 */
export function resolveWheelData(language: Language = "en"): WheelData {
  type StructDomain = (typeof WHEEL_STRUCTURE)["domains"][number];
  type StructCause = StructDomain["causes"][number];
  type StructSignal = StructCause["signals"][number];

  const resolveSignal = (s: StructSignal) => ({
    id: s.id,
    name: translate(s.name_key, language),
    severity: s.severity,
    level: s.level,
    indicators: s.indicators.map((i) => ({ id: i.id, name: translate(i.name_key, language) })),
    interventions: [...s.intervention_ids],
  });

  const resolveCause = (c: StructCause, domainCode: string) => {
    const signals = c.signals.map(resolveSignal);
    const indicators = [
      ...new Map(signals.flatMap((s) => s.indicators ?? []).map((i) => [i.id, i])).values(),
    ];
    const interventions = [...new Set(signals.flatMap((s) => s.interventions ?? []))];
    return {
      id: c.id,
      code: `${domainCode}-${c.code}`,
      name: translate(c.name_key, language),
      signals,
      indicators,
      interventions,
    };
  };

  const resolveDomain = (d: StructDomain) => ({
    id: d.id,
    name: translate(d.name_key, language),
    color: d.color,
    causes: d.causes.map((c) => resolveCause(c, d.code)),
  });

  return {
    wheel_name: "CX Diagnostic Compass",
    version: "2.0",
    center: {
      id: WHEEL_STRUCTURE.center.id,
      name: translate(WHEEL_STRUCTURE.center.name_key, language),
      description: translate(WHEEL_STRUCTURE.center.description_key, language),
    },
    domains: WHEEL_STRUCTURE.domains.map(resolveDomain),
  };
}
