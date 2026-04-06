import axios from 'axios';

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? 'http://n8n:5678';

export async function dispatchToN8n(
  workflowId: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const url = `${N8N_BASE_URL}/webhook/${workflowId}`;

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000
    });
    return response.data as Record<string, unknown>;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(`WORKFLOW_UNREACHABLE: ${err.message}`);
    }
    throw err;
  }
}
