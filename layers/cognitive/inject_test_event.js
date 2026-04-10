// Simple script to inject a test event via the cognitive container
const testEvent = {
  contact_id: 'TEST_CID_001',
  stage: 'ONB',
  signal_id: 'ONB_FRC_01',
  signal_severity: 0.7,
  cause_code: 'ONB-FRC',
  interventions: ['INT_ONB_FRC_01_A', 'INT_ONB_FRC_01_B', 'INT_ONB_FRC_01_C'],
  payload: { blocker_description: 'test event for memory verification' },
  meta: { triggered_by: 'manual test — Phase 3 C3 verification' },
  channel: 'internal'
};

console.log('Test event payload:');
console.log(JSON.stringify(testEvent, null, 2));