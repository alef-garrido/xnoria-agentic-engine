-- Acquisition Stage Seed Pack
INSERT INTO filter_action (action_id, stage, n8n_workflow_id, requires_hitl, manual_action, enabled, description, description_es)
VALUES
  (
    'acq.lead.score',
    'ACQ',
    'xnoria-acq-lead-score-v1',
    false,
    false,
    true,
    'Score an incoming lead using rule-based logic and apply CRM tags in HubSpot',
    'Calificar un lead entrante con lógica basada en reglas y aplicar etiquetas en HubSpot'
  ),
  (
    'acq.lead.engage',
    'ACQ',
    'acq-lead-engage',
    false,
    false,
    true,
    'Send immediate WhatsApp acknowledgment to inbound lead',
    'Enviar confirmación inmediata por WhatsApp al lead entrante'
  ),
  (
    'acq.lead.nurture',
    'ACQ',
    'acq-lead-nurture',
    false,
    false,
    true,
    'AI nurture conversation for out-of-hours contacts',
    'Conversación de nurturing con IA para contactos fuera de horario'
  ),
  (
    'acq.contact.outreach',
    'ACQ',
    'acq-contact-outreach',
    true,
    false,
    true,
    'Cold outreach via WhatsApp + email, sync to HubSpot — requires HITL operator review before sending',
    'Prospección en frío por WhatsApp + email con sincronización a HubSpot — requiere revisión del operador (HITL) antes del envío'
  ),
  (
    'acq.contact.upsert',
    'ACQ',
    'acq-contact-upsert',
    false,
    false,
    true,
    'Create or update a contact in HubSpot CRM, returns contact_id for chaining',
    'Crear o actualizar un contacto en HubSpot CRM, devuelve contact_id para acciones encadenadas'
  ),
  (
    'acq.contact.get',
    'ACQ',
    'acq-contact-get',
    false,
    false,
    true,
    'Retrieve contact properties from HubSpot including CX pain points and PCI score',
    'Recuperar propiedades del contacto en HubSpot, incluyendo puntos de dolor CX y puntuación PCI'
  )
ON CONFLICT (action_id) DO UPDATE
  SET
    stage           = EXCLUDED.stage,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    requires_hitl   = EXCLUDED.requires_hitl,
    manual_action   = EXCLUDED.manual_action,
    enabled         = EXCLUDED.enabled,
    description     = EXCLUDED.description,
    description_es  = EXCLUDED.description_es,
    updated_at      = now();
