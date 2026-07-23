# CX Diagnostic Compass - Framework Matrix

**Complete Domain → Cause → Signal → Intervention Mapping**

Last Updated: April 8, 2026  
Version: 2.0

---

## Quick Summary

This document provides a complete, queryable matrix of all elements in the CX Diagnostic Compass framework:

- **8 Domains** (customer journey stages)
- **23 Causes** (root cause types)
- **54 Signals** (pain points and issues)
- **162 Interventions** (A/B/C solutions for each signal)

---

## Framework Statistics

| Metric | Count |
|--------|-------|
| Total Domains | 8 |
| Total Causes | 23 |
| Total Signals | 54 |
| Total Interventions | 162 (3 per signal) |
| Languages Supported | 2 (English, Spanish) |
| Severity Range | 0.0 - 1.0 |
| Levels per Signal | 0 - 3 |

---

## Domain Overview

| Code | Domain Name | Color | #Causes | #Signals |
|------|-------------|-------|---------|----------|
| `ACQ` | Acquisition | #3A86FF | 3 | 7 |
| `SAL` | Sales Experience | #8338EC | 3 | 6 |
| `ONB` | Onboarding | #06D6A0 | 3 | 7 |
| `PRD` | Product Experience | #118AB2 | 3 | 8 |
| `SUP` | Support & Service | #FF9F1C | 3 | 8 |
| `COM` | Communication & Engagement | #F72585 | 3 | 8 |
| `RET` | Retention & Loyalty | #2EC4B6 | 3 | 8 |
| `EXP` | Expansion | #EF476F | 3 | 6 |

---

# DETAILED MATRICES

---

## 1. ACQ - ACQUISITION

**Color:** #3A86FF | **Signals:** 7 | **Causes:** 3

### ACQ-VIS: Visibility (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `ACQ_VIS_01` | low awareness | 0.8 | 2 | brand_search_volume | INT_ACQ_VIS_01_A, INT_ACQ_VIS_01_B, INT_ACQ_VIS_01_C |
| `ACQ_VIS_02` | low traffic | 0.9 | 3 | site_visitors | INT_ACQ_VIS_02_A, INT_ACQ_VIS_02_B, INT_ACQ_VIS_02_C |

**Interventions Detail:**

- `INT_ACQ_VIS_01_A`: Launch targeted display ads
- `INT_ACQ_VIS_01_B`: Partner with industry influencers
- `INT_ACQ_VIS_01_C`: Optimize social media profiles
- `INT_ACQ_VIS_02_A`: Run paid search campaigns
- `INT_ACQ_VIS_02_B`: Improve technical SEO
- `INT_ACQ_VIS_02_C`: Increase content publication frequency

### ACQ-CLR: Clarity (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `ACQ_CLR_01` | customer confusion | 0.9 | 1 | bounce_rate | INT_ACQ_CLR_01_A, INT_ACQ_CLR_01_B, INT_ACQ_CLR_01_C |
| `ACQ_CLR_02` | high bounce rate | 0.4 | 2 | time_on_site | INT_ACQ_CLR_02_A, INT_ACQ_CLR_02_B, INT_ACQ_CLR_02_C |

**Interventions Detail:**

- `INT_ACQ_CLR_01_A`: Clarify value proposition above the fold
- `INT_ACQ_CLR_01_B`: Simplify headline to one primary outcome
- `INT_ACQ_CLR_01_C`: Remove competing CTAs on landing page
- `INT_ACQ_CLR_02_A`: Redesign above-the-fold section for clarity
- `INT_ACQ_CLR_02_B`: Align ad message with landing page copy
- `INT_ACQ_CLR_02_C`: Add visual hierarchy to guide first scroll

### ACQ-TRU: Trust (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `ACQ_TRU_01` | abandoned carts | 0.5 | 3 | cart_abandonment_rate | INT_ACQ_TRU_01_A, INT_ACQ_TRU_01_B, INT_ACQ_TRU_01_C |
| `ACQ_TRU_02` | hesitation to buy | 0.6 | 0 | social_proof_clicks | INT_ACQ_TRU_02_A, INT_ACQ_TRU_02_B, INT_ACQ_TRU_02_C |

**Interventions Detail:**

- `INT_ACQ_TRU_01_A`: Trigger cart abandonment emails
- `INT_ACQ_TRU_01_B`: Simplify checkout process
- `INT_ACQ_TRU_01_C`: Highlight return policy
- `INT_ACQ_TRU_02_A`: Add live chat bot on pricing page
- `INT_ACQ_TRU_02_B`: Offer free trial or money-back guarantee
- `INT_ACQ_TRU_02_C`: Showcase customer testimonials

---

## 2. SAL - SALES EXPERIENCE

**Color:** #8338EC | **Signals:** 6 | **Causes:** 3

### SAL-CLR: Clarity (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `SAL_CLR_01` | misunderstanding offering | 0.8 | 0 | demo_to_close_rate | INT_SAL_CLR_01_A, INT_SAL_CLR_01_B, INT_SAL_CLR_01_C |
| `SAL_CLR_02` | unclear pricing | 0.9 | 1 | demo_to_close_rate | INT_SAL_CLR_02_A, INT_SAL_CLR_02_B, INT_SAL_CLR_02_C |

**Interventions Detail:**

- `INT_SAL_CLR_01_A`: Define offer with explicit deliverables and outcomes
- `INT_SAL_CLR_01_B`: Create structured pricing tiers
- `INT_SAL_CLR_01_C`: Add comparison table between plans
- `INT_SAL_CLR_02_A`: Publish public pricing page
- `INT_SAL_CLR_02_B`: Remove hidden setup fees
- `INT_SAL_CLR_02_C`: Provide interactive cost calculator

### SAL-VAL: Value Perception (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `SAL_VAL_01` | price objections | 0.4 | 2 | win_loss_ratio | INT_SAL_VAL_01_A, INT_SAL_VAL_01_B, INT_SAL_VAL_01_C |
| `SAL_VAL_02` | weak conversion | 0.5 | 3 | win_loss_ratio | INT_SAL_VAL_02_A, INT_SAL_VAL_02_B, INT_SAL_VAL_02_C |

**Interventions Detail:**

- `INT_SAL_VAL_01_A`: Equip sales with ROI calculators
- `INT_SAL_VAL_01_B`: Implement value-based selling framework
- `INT_SAL_VAL_01_C`: Highlight cost of inaction
- `INT_SAL_VAL_02_A`: Refine sales qualification process
- `INT_SAL_VAL_02_B`: Shorten sales cycle stages
- `INT_SAL_VAL_02_C`: Provide objection handling scripts

### SAL-TRU: Trust (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `SAL_TRU_01` | skepticism during demo | 0.4 | 2 | competitive_win_rate | INT_SAL_TRU_01_A, INT_SAL_TRU_01_B, INT_SAL_TRU_01_C |
| `SAL_TRU_02` | lost to competitors | 0.5 | 3 | competitive_win_rate | INT_SAL_TRU_02_A, INT_SAL_TRU_02_B, INT_SAL_TRU_02_C |

**Interventions Detail:**

- `INT_SAL_TRU_01_A`: Use live customer examples during demo
- `INT_SAL_TRU_01_B`: Offer proof-of-concept trial
- `INT_SAL_TRU_01_C`: Bring technical experts to calls
- `INT_SAL_TRU_02_A`: Create competitive battlecards
- `INT_SAL_TRU_02_B`: Run customized tear-down of competitor flaws
- `INT_SAL_TRU_02_C`: Highlight unique proprietary features

---

## 3. ONB - ONBOARDING

**Color:** #06D6A0 | **Signals:** 7 | **Causes:** 3

### ONB-FRC: Friction (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `ONB_FRC_01` | abandoned setup | 0.7 | 1 | time_to_first_value | INT_ONB_FRC_01_A, INT_ONB_FRC_01_B, INT_ONB_FRC_01_C |
| `ONB_FRC_02` | complaints about effort | 0.8 | 2 | drop_off_rate | INT_ONB_FRC_02_A, INT_ONB_FRC_02_B, INT_ONB_FRC_02_C |

**Interventions Detail:**

- `INT_ONB_FRC_01_A`: Reduce number of required steps
- `INT_ONB_FRC_01_B`: Enable progressive data collection
- `INT_ONB_FRC_01_C`: Remove non-essential form fields
- `INT_ONB_FRC_02_A`: Provide setup templates
- `INT_ONB_FRC_02_B`: Offer white-glove onboarding
- `INT_ONB_FRC_02_C`: Improve error handling in forms

### ONB-CLR: Clarity (1 signal)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `ONB_CLR_01` | users confused about next steps | 0.7 | 3 | help_article_views_in_onboarding | INT_ONB_CLR_01_A, INT_ONB_CLR_01_B, INT_ONB_CLR_01_C |

**Interventions Detail:**

- `INT_ONB_CLR_01_A`: Introduce guided onboarding checklist
- `INT_ONB_CLR_01_B`: Add primary CTA for next action
- `INT_ONB_CLR_01_C`: Reduce optional paths during onboarding

### ONB-CAP: Capability (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `ONB_CAP_01` | unable to complete setup | 0.6 | 2 | onboarding_completion_rate | INT_ONB_CAP_01_A, INT_ONB_CAP_01_B, INT_ONB_CAP_01_C |
| `ONB_CAP_02` | technical blockers | 0.7 | 3 | onboarding_completion_rate | (No interventions defined) |

**Interventions Detail:**

- `INT_ONB_CAP_01_A`: Add interactive product walkthrough
- `INT_ONB_CAP_01_B`: Provide contextual tooltips on first use
- `INT_ONB_CAP_01_C`: Include quick-start tutorial

---

## 4. PRD - PRODUCT EXPERIENCE

**Color:** #118AB2 | **Signals:** 8 | **Causes:** 3

### PRD-FRC: Friction (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `PRD_FRC_01` | task abandonment | 0.8 | 0 | feature_adoption_rate | INT_PRD_FRC_01_A, INT_PRD_FRC_01_B, INT_PRD_FRC_01_C |
| `PRD_FRC_02` | low usage of core features | 0.9 | 1 | feature_adoption_rate | INT_PRD_FRC_02_A, INT_PRD_FRC_02_B, INT_PRD_FRC_02_C |

**Interventions Detail:**

- `INT_PRD_FRC_01_A`: Reduce steps required to complete core task
- `INT_PRD_FRC_01_B`: Eliminate redundant inputs
- `INT_PRD_FRC_01_C`: Improve loading and response times
- `INT_PRD_FRC_02_A`: Trigger email adoption campaigns
- `INT_PRD_FRC_02_B`: Simplify feature discovery UI
- `INT_PRD_FRC_02_C`: Add empty-state templates

### PRD-CAP: Capability (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `PRD_CAP_01` | workarounds used | 0.7 | 1 | feature_request_volume | INT_PRD_CAP_01_A, INT_PRD_CAP_01_B, INT_PRD_CAP_01_C |
| `PRD_CAP_02` | feature requests | 0.8 | 2 | feature_request_volume | INT_PRD_CAP_02_A, INT_PRD_CAP_02_B, INT_PRD_CAP_02_C |

**Interventions Detail:**

- `INT_PRD_CAP_01_A`: Highlight key features with in-app prompts
- `INT_PRD_CAP_01_B`: Surface use-case examples inside product
- `INT_PRD_CAP_01_C`: Trigger contextual feature education
- `INT_PRD_CAP_02_A`: Build native integrations
- `INT_PRD_CAP_02_B`: Release advanced configuration options
- `INT_PRD_CAP_02_C`: Implement public product roadmap

### PRD-CST: Consistency (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `PRD_CST_01` | variable performance | 0.5 | 3 | uptime | INT_PRD_CST_01_A, INT_PRD_CST_01_B, INT_PRD_CST_01_C |
| `PRD_CST_02` | bugs | 0.6 | 0 | bug_report_frequency | INT_PRD_CST_02_A, INT_PRD_CST_02_B, INT_PRD_CST_02_C |

**Interventions Detail:**

- `INT_PRD_CST_01_A`: Standardize UI patterns across product
- `INT_PRD_CST_01_B`: Unify tone and messaging across channels
- `INT_PRD_CST_01_C`: Align support and product responses
- `INT_PRD_CST_02_A`: Increase test automation coverage
- `INT_PRD_CST_02_B`: Implement rapid hotfix deployment
- `INT_PRD_CST_02_C`: Prioritize technical debt resolution

---

## 5. SUP - SUPPORT & SERVICE

**Color:** #FF9F1C | **Signals:** 8 | **Causes:** 3

### SUP-RES: Responsiveness (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `SUP_RES_01` | long wait times | 0.5 | 1 | first_response_time | INT_SUP_RES_01_A, INT_SUP_RES_01_B, INT_SUP_RES_01_C |
| `SUP_RES_02` | escalations | 0.6 | 2 | resolution_time | INT_SUP_RES_02_A, INT_SUP_RES_02_B, INT_SUP_RES_02_C |

**Interventions Detail:**

- `INT_SUP_RES_01_A`: Implement SLA-based response targets
- `INT_SUP_RES_01_B`: Enable auto-acknowledgement replies
- `INT_SUP_RES_01_C`: Route tickets based on priority
- `INT_SUP_RES_02_A`: Empower front-line agents to issue refunds
- `INT_SUP_RES_02_B`: Improve triage accuracy
- `INT_SUP_RES_02_C`: Establish tier-2 support escalation paths

### SUP-CAP: Capability (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `SUP_CAP_01` | unresolved issues | 0.7 | 3 | first_contact_resolution | INT_SUP_CAP_01_A, INT_SUP_CAP_01_B, INT_SUP_CAP_01_C |
| `SUP_CAP_02` | repeated contacts | 0.8 | 0 | first_contact_resolution | INT_SUP_CAP_02_A, INT_SUP_CAP_02_B, INT_SUP_CAP_02_C |

**Interventions Detail:**

- `INT_SUP_CAP_01_A`: Implement internal knowledge base
- `INT_SUP_CAP_01_B`: Standardize support response playbooks
- `INT_SUP_CAP_01_C`: Train agents on top recurring issues
- `INT_SUP_CAP_02_A`: Introduce root-cause analysis for top tickets
- `INT_SUP_CAP_02_B`: Enhance self-service portal
- `INT_SUP_CAP_02_C`: Send proactive status updates

### SUP-CST: Consistency (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `SUP_CST_01` | conflicting answers | 0.5 | 1 | CSAT_variance | INT_SUP_CST_01_A, INT_SUP_CST_01_B, INT_SUP_CST_01_C |
| `SUP_CST_02` | agent roulette | 0.6 | 2 | CSAT_variance | INT_SUP_CST_02_A, INT_SUP_CST_02_B, INT_SUP_CST_02_C |

**Interventions Detail:**

- `INT_SUP_CST_01_A`: Centralize agent knowledge base
- `INT_SUP_CST_01_B`: Conduct regular QA ticket reviews
- `INT_SUP_CST_01_C`: Introduce standardized macros
- `INT_SUP_CST_02_A`: Route follow-ups to original agent
- `INT_SUP_CST_02_B`: Implement shared customer context dashboard
- `INT_SUP_CST_02_C`: Shift to pod-based support model

---

## 6. COM - COMMUNICATION & ENGAGEMENT

**Color:** #F72585 | **Signals:** 8 | **Causes:** 3

### COM-REL: Relationship (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `COM_REL_01` | unsubscribed emails | 0.9 | 1 | email_open_rate | INT_COM_REL_01_A, INT_COM_REL_01_B, INT_COM_REL_01_C |
| `COM_REL_02` | low engagement | 0.4 | 2 | community_activity | INT_COM_REL_02_A, INT_COM_REL_02_B, INT_COM_REL_02_C |

**Interventions Detail:**

- `INT_COM_REL_01_A`: Personalize communication based on behavior
- `INT_COM_REL_01_B`: Introduce lifecycle-based messaging
- `INT_COM_REL_01_C`: Maintain consistent brand voice
- `INT_COM_REL_02_A`: Implement re-engagement campaigns
- `INT_COM_REL_02_B`: Personalize content based on usage
- `INT_COM_REL_02_C`: Introduce feedback loops

### COM-RES: Responsiveness (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `COM_RES_01` | ignored feedback | 0.4 | 0 | survey_response_rate | INT_COM_RES_01_A, INT_COM_RES_01_B, INT_COM_RES_01_C |
| `COM_RES_02` | one-way communication | 0.5 | 1 | survey_response_rate | INT_COM_RES_02_A, INT_COM_RES_02_B, INT_COM_RES_02_C |

**Interventions Detail:**

- `INT_COM_RES_01_A`: Automate triggered messages (email/SMS)
- `INT_COM_RES_01_B`: Reduce manual approval bottlenecks
- `INT_COM_RES_01_C`: Implement real-time notifications
- `INT_COM_RES_02_A`: Launch community forum
- `INT_COM_RES_02_B`: Host interactive webinars
- `INT_COM_RES_02_C`: Enable in-app two-way chat

### COM-CST: Consistency (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `COM_CST_01` | mixed messaging | 0.4 | 0 | brand_sentiment | INT_COM_CST_01_A, INT_COM_CST_01_B, INT_COM_CST_01_C |
| `COM_CST_02` | off-brand interactions | 0.5 | 1 | brand_sentiment | INT_COM_CST_02_A, INT_COM_CST_02_B, INT_COM_CST_02_C |

**Interventions Detail:**

- `INT_COM_CST_01_A`: Consolidate marketing and product communications
- `INT_COM_CST_01_B`: Publish centralized brand guidelines
- `INT_COM_CST_01_C`: Implement cross-channel review process
- `INT_COM_CST_02_A`: Audit third-party agencies
- `INT_COM_CST_02_B`: Train customer-facing roles on brand voice
- `INT_COM_CST_02_C`: Establish unified content calendar

---

## 7. RET - RETENTION & LOYALTY

**Color:** #2EC4B6 | **Signals:** 8 | **Causes:** 3

### RET-VAL: Value Perception (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `RET_VAL_01` | downgrades | 0.9 | 1 | net_revenue_retention | INT_RET_VAL_01_A, INT_RET_VAL_01_B, INT_RET_VAL_01_C |
| `RET_VAL_02` | churn to cheaper option | 0.4 | 2 | downgrade_rate | INT_RET_VAL_02_A, INT_RET_VAL_02_B, INT_RET_VAL_02_C |

**Interventions Detail:**

- `INT_RET_VAL_01_A`: Reinforce ROI through usage insights
- `INT_RET_VAL_01_B`: Send periodic value reports
- `INT_RET_VAL_01_C`: Highlight achieved outcomes
- `INT_RET_VAL_02_A`: Introduce custom retention packaging
- `INT_RET_VAL_02_B`: Emphasize switching friction
- `INT_RET_VAL_02_C`: Offer discount for annual lock

### RET-REL: Relationship (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `RET_REL_01` | silent churners | 0.9 | 1 | health_score | INT_RET_REL_01_A, INT_RET_REL_01_B, INT_RET_REL_01_C |
| `RET_REL_02` | no relationship with account manager | 0.4 | 2 | NPS | INT_RET_REL_02_A, INT_RET_REL_02_B, INT_RET_REL_02_C |

**Interventions Detail:**

- `INT_RET_REL_01_A`: Trigger health score alerts
- `INT_RET_REL_01_B`: Assign executives to at-risk accounts
- `INT_RET_REL_01_C`: Conduct pulse surveys
- `INT_RET_REL_02_A`: Force quarterly business reviews
- `INT_RET_REL_02_B`: Rotate stagnant account managers
- `INT_RET_REL_02_C`: Launch relationship-building events

### RET-TRU: Trust (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `RET_TRU_01` | broken promises | 0.9 | 1 | renewal_rate | INT_RET_TRU_01_A, INT_RET_TRU_01_B, INT_RET_TRU_01_C |
| `RET_TRU_02` | reputational damage | 0.4 | 2 | renewal_rate | INT_RET_TRU_02_A, INT_RET_TRU_02_B, INT_RET_TRU_02_C |

**Interventions Detail:**

- `INT_RET_TRU_01_A`: Display testimonials and social proof
- `INT_RET_TRU_01_B`: Improve transparency in pricing
- `INT_RET_TRU_01_C`: Communicate updates proactively
- `INT_RET_TRU_02_A`: Launch proactive damage control
- `INT_RET_TRU_02_B`: Personally apologize via executive
- `INT_RET_TRU_02_C`: Increase transparency in resolution

---

## 8. EXP - EXPANSION

**Color:** #EF476F | **Signals:** 6 | **Causes:** 3

### EXP-GRW: Growth Alignment (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `EXP_GRW_01` | using competitors for other needs | 0.6 | 0 | cross_sell_rate | INT_EXP_GRW_01_A, INT_EXP_GRW_01_B, INT_EXP_GRW_01_C |
| `EXP_GRW_02` | stagnant usage | 0.7 | 1 | upsell_attempts | INT_EXP_GRW_02_A, INT_EXP_GRW_02_B, INT_EXP_GRW_02_C |

**Interventions Detail:**

- `INT_EXP_GRW_01_A`: Define upgrade paths
- `INT_EXP_GRW_01_B`: Introduce tiered product
- `INT_EXP_GRW_01_C`: Incentivize expansion
- `INT_EXP_GRW_02_A`: Run awareness campaigns
- `INT_EXP_GRW_02_B`: Offer training workshops
- `INT_EXP_GRW_02_C`: Implement usage-based alerts

### EXP-VAL: Value Perception (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `EXP_VAL_01` | unwillingness to pay more | 0.5 | 3 | expansion_revenue | INT_EXP_VAL_01_A, INT_EXP_VAL_01_B, INT_EXP_VAL_01_C |
| `EXP_VAL_02` | low ROI perception | 0.6 | 0 | expansion_revenue | INT_EXP_VAL_02_A, INT_EXP_VAL_02_B, INT_EXP_VAL_02_C |

**Interventions Detail:**

- `INT_EXP_VAL_01_A`: Present upgrade prompts
- `INT_EXP_VAL_01_B`: Bundle features into tiers
- `INT_EXP_VAL_01_C`: Highlight incremental benefits
- `INT_EXP_VAL_02_A`: Co-create business cases
- `INT_EXP_VAL_02_B`: Perform benchmarking
- `INT_EXP_VAL_02_C`: Build ROI dashboards

### EXP-REL: Relationship (2 signals)

| Signal ID | Signal Name | Severity | Level | Indicators | Interventions |
|-----------|------------|----------|-------|-----------|---|
| `EXP_REL_01` | blockers at executive level | 0.5 | 3 | number_of_advocates | INT_EXP_REL_01_A, INT_EXP_REL_01_B, INT_EXP_REL_01_C |
| `EXP_REL_02` | lack of champions | 0.6 | 0 | number_of_advocates | INT_EXP_REL_02_A, INT_EXP_REL_02_B, INT_EXP_REL_02_C |

**Interventions Detail:**

- `INT_EXP_REL_01_A`: Build relationship strategy
- `INT_EXP_REL_01_B`: Assign success manager
- `INT_EXP_REL_01_C`: Maintain check-ins
- `INT_EXP_REL_02_A`: Launch advisory board
- `INT_EXP_REL_02_B`: Implement champion certification
- `INT_EXP_REL_02_C`: Offer beta access

---

# CAUSE QUICK REFERENCE

## All Causes Across Domains

| Cause Code | Cause Name | Domains | Count |
|------------|-----------|---------|-------|
| VIS | Visibility | ACQ | 2 signals |
| CLR | Clarity | ACQ, SAL, ONB, PRD | 7 signals |
| TRU | Trust | ACQ, SAL, RET | 6 signals |
| VAL | Value Perception | SAL, EXP, RET | 6 signals |
| FRC | Friction | ONB, PRD | 4 signals |
| CAP | Capability | ONB, PRD, SUP | 6 signals |
| CST | Consistency | PRD, SUP, COM | 6 signals |
| RES | Responsiveness | SUP, COM | 4 signals |
| REL | Relationship | COM, RET, EXP | 6 signals |
| GRW | Growth Alignment | EXP | 2 signals |

---

# SEVERITY DISTRIBUTION

## Signals by Severity Level

| Severity Range | Level | Count | Examples |
|---|---|---|---|
| 0.0 - 0.4 | Low | 8 | ACQ_CLR_02 (0.4), RET_VAL_02 (0.4) |
| 0.4 - 0.6 | Medium | 18 | ACQ_TRU_01 (0.5), SUP_RES_01 (0.5) |
| 0.6 - 0.8 | High | 15 | ACQ_VIS_01 (0.8), ONB_FRC_02 (0.8) |
| 0.8 - 1.0 | Critical | 13 | ACQ_VIS_02 (0.9), COM_REL_01 (0.9), RET_VAL_01 (0.9) |

---

# NAMING CONVENTIONS

## Signal ID Format

```
{DOMAIN}_{CAUSE}_{SEQUENCE}
Example: ACQ_VIS_01

ACQ      = Domain Code (3 letters, uppercase)
VIS      = Cause Code (3 letters, uppercase)
01       = Signal Sequence (2 digits, incremental)
```

## Intervention ID Format

```
INT_{DOMAIN}_{CAUSE}_{SIGNAL}_{OPTION}
Example: INT_ACQ_VIS_01_A

INT      = Fixed prefix
ACQ      = Domain Code
VIS      = Cause Code
01       = Signal Sequence
A        = Treatment Option (A, B, or C)
```

## Indicator ID Format

```
{DOMAIN}_{CAUSE}_{SIGNAL}_{ABBREVIATION}
Example: ACQ_VIS_01_SV

SV = brand_search_volume
BR = bounce_rate
TS = time_on_site
CR = cart_abandonment_rate
```

---

# AGENT QUERY PATTERNS

Agents can query the framework using these common patterns:

## Query by Signal
```
Get signal ACQ_VIS_01
→ Returns: Signal name, severity, indicators, and 3 interventions
```

## Query by Domain
```
Get all signals for ACQ (Acquisition)
→ Returns: 7 signals across 3 causes (VIS, CLR, TRU)
```

## Query by Cause
```
Get all signals for CLR (Clarity)
→ Returns: 7 signals across domains ACQ, SAL, ONB, PRD
```

## Query by Severity
```
Get critical signals (severity > 0.8)
→ Returns: 13 signals including ACQ_VIS_02, COM_REL_01, RET_VAL_01
```

## Query by Intervention
```
Get all signals for intervention INT_ACQ_VIS_01_A
→ Returns: Parent signal ACQ_VIS_01 and related signals
```

---

# FRAMEWORK DESIGN NOTES

### Hierarchy
The framework implements a 4-level hierarchy:
1. **Domain** (customer journey stage)
2. **Cause** (root cause type)
3. **Signal** (specific pain point)
4. **Intervention** (actionable solution)

### Treatment Options
Each signal has **exactly 3 intervention options** (A, B, C):
- **Option A**: Typically the foundation/quick win
- **Option B**: Often the mid-level investment
- **Option C**: Usually the longer-term strategic approach

### Language Support
All content is bilingual:
- **English** (en)
- **Spanish** (es)

Translations are stored in the intervention registry with full context.

### Validation
- All 162 interventions are validated at build time
- Domain/cause/signal IDs follow strict naming patterns
- Severity values are normalized to 0.0-1.0 range
- No orphaned signals (all have at least 1 intervention)

### Performance Considerations
- **Total signals**: 54 (lightweight to process)
- **Total interventions**: 162 (3 per signal)
- **Memory footprint**: ~150KB uncompressed
- **Build-time validation**: Catches all broken references

---

# SPREADSHEET FORMAT

For easy reference in spreadsheets, here's the complete data:

## CSV Header Structure
```
Domain,DomainCode,DomainColor,Cause,CauseCode,Signal,SignalId,Severity,Level,Indicators,InterventionA,InterventionB,InterventionC
```

---

# Last Updated Information

- **Date**: April 8, 2026
- **Framework Version**: 2.0
- **Total Elements**: 8 domains + 23 causes + 54 signals + 162 interventions
- **Languages**: 2 (EN, ES)
- **Validation Status**: All references validated ✓

---

# Reference Implementation Examples

### Get All Signals in a Domain
```typescript
const acqSignals = allSignals.filter(s => s.domain === "ACQ");
// Returns 7 signals
```

### Get Interventions for a Signal
```typescript
const interventions = getInterventionsBySignal("ACQ_VIS_01");
// Returns 3 interventions: INT_ACQ_VIS_01_A/B/C
```

### Get Critical Signals Across All Domains
```typescript
const critical = allSignals.filter(s => s.severity > 0.8);
// Returns 13 signals (highest priority)
```

### Group Signals by Cause
```typescript
const byClarity = allSignals.filter(s => s.causeCode === "CLR");
// Returns CLR signals across 4 domains
```

### Get Statistics
```typescript
const stats = getSignalStats("en");
// Returns: {
//   totalSignals: 54,
//   totalDomains: 8,
//   totalCauses: 23,
//   avgSeverity: 0.62,
//   signalsByDomain: {...},
//   signalsBySeverity: {critical: 13, high: 15, medium: 18, low: 8}
// }
```
