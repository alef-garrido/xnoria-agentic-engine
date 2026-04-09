import json

with open('layers/orchestration/workflows/w6-ret-contact-winback.json', 'r') as f:
    w = json.load(f)

# Find 'code-winback-logic' and update its code
for n in w['nodes']:
    if n['id'] == 'code-winback-logic':
        n['name'] = 'Code -- build winback payload'
        n['parameters']['jsCode'] = """// Exnoria - ret.contact.winback
// Determine winback sequence and build WhatsApp payload

const webhook = $("Webhook").first().json.body;
const contact = $input.first().json;

const { contact_id, signal_id, signal_severity, cause_code } = webhook;

const firstname = contact.properties?.firstname?.value ?? 'Contact';
const email     = contact.properties?.email?.value     ?? '';
const phone     = contact.properties?.phone?.value     ?? '';

const cleanPhone = phone.replace(/[^\\d]/g, '');

const sequenceMap = {
  'RET-VAL': { id: 'seq_winback_value', name: 'Value Demonstration Sequence' },
  'RET-REL': { id: 'seq_winback_relationship', name: 'Relationship Recovery Sequence' },
  'RET-COM': { id: 'seq_winback_competitive', name: 'Competitive Win-back Sequence' },
  'RET-PRI': { id: 'seq_winback_pricing', name: 'Pricing Retention Sequence' }
};

const sequence = sequenceMap[cause_code] || { id: 'seq_winback_generic', name: 'Generic Winback Sequence' };

const message = [
  'Hi ' + firstname + ',',
  '',
  'We noticed you might be closing your account. We highly value your feedback and would love to stay connected.',
  '',
  sequence.id === 'seq_winback_pricing' ? 'We have successfully assigned a 20% retention discount to your account!' : 'Our relationship manager is ready to schedule a free optimization audit.',
  '',
  'Reply to this message if you want to chat!',
  '',
  '-- Exnoria Success Team'
].join('\\n');

const whatsapp_payload = cleanPhone ? {
  messaging_product: 'whatsapp',
  to: cleanPhone,
  type: 'text',
  text: { body: message }
} : null;

const winbackAt = new Date(new Date().setUTCHours(0,0,0,0)).getTime();

return [{
  json: {
    contact_id,
    signal_id,
    cause_code,
    email,
    firstname,
    phone: cleanPhone,
    whatsapp_payload,
    sequence_id: sequence.id,
    sequence_name: sequence.name,
    winback_at: winbackAt
  }
}];"""

    if n['id'] == 'simulate-winback-enroll':
        n['id'] = 'http-meta-whatsapp-w6'
        n['name'] = 'Meta WA -- enroll contact'
        n['type'] = 'n8n-nodes-base.httpRequest'
        n['typeVersion'] = 4.2
        n['parameters'] = {
            "method": "POST",
            "url": "=https://graph.facebook.com/v19.0/{{ $env.META_PHONE_NUMBER_ID }}/messages",
            "authentication": "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "sendHeaders": True,
            "headerParameters": {
              "parameters": [{"name": "Content-Type", "value": "application/json"}]
            },
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": '={{ JSON.stringify($("Code -- build winback payload").item.json.whatsapp_payload) }}',
            "options": {}
        }
        n['credentials'] = {
            "httpHeaderAuth": {
                "name": "Meta WhatsApp Token"
            }
        }
    
    if n['id'] == 'hubspot-update-contact-w6':
        n['parameters']['email'] = '={{ $("Code -- build winback payload").item.json.email }}'

    if n['id'] == 'respond-w6':
        n['parameters']['responseBody'] = """={
  "status": "executed",
  "action_id": "ret.contact.winback",
  "contact_id": "{{ $("Code -- build winback payload").item.json.contact_id }}",
  "enrolled_via": "whatsapp",
  "sequence_id": "{{ $("Code -- build winback payload").item.json.sequence_id }}",
  "sequence_name": "{{ $("Code -- build winback payload").item.json.sequence_name }}",
  "cause_code": "{{ $("Code -- build winback payload").item.json.cause_code }}"
}"""

# Update connections
w['connections']['Code -- build winback payload'] = {
    'main': [[{'node': 'Meta WA -- enroll contact', 'type': 'main', 'index': 0}]]
}
w['connections']['Meta WA -- enroll contact'] = {
    'main': [[{'node': 'HubSpot -- update contact', 'type': 'main', 'index': 0}]]
}
del w['connections']['Code -- winback logic']
del w['connections']['Simulate -- winback enroll']


with open('layers/orchestration/workflows/w6-ret-contact-winback.json', 'w') as f:
    json.dump(w, f, indent=2)

print("Modification complete")
