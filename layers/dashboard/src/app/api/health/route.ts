/**
 * Health check endpoint
 * GET /api/health - Check health of Exnoria CX services
 */
import { NextResponse } from 'next/server';
import { fetchDockerAPI, type DockerContainer } from '@/lib/docker';

interface ServiceCheck {
  name: string;
  status: 'up' | 'down' | 'unknown';
  details?: string;
}

export async function GET() {
  const checks: ServiceCheck[] = [];
  const projectId = process.env.PROJECT_ID || 'exnoria';
  const targetServices = [
    `${projectId}_postgres`,
    `${projectId}_n8n`,
    `${projectId}_filter`,
    `${projectId}_cognitive`,
  ];

  try {
    const containers = await fetchDockerAPI<DockerContainer[]>('/containers/json?all=true');

    for (const target of targetServices) {
      const container = containers.find((c) =>
        c.Names.some((n: string) => n === `/${target}`)
      );

      if (!container) {
        checks.push({ name: target, status: 'down', details: 'container not found' });
      } else {
        const isRunning = container.State === 'running';
        checks.push({
          name: target,
          status: isRunning ? 'up' : 'down',
          details: container.Status,
        });
      }
    }
  } catch {
    // Docker socket not available
    for (const target of targetServices) {
      checks.push({ name: target, status: 'unknown', details: 'docker socket unavailable' });
    }
  }

  const downCount = checks.filter((c) => c.status === 'down').length;
  const unknownCount = checks.filter((c) => c.status === 'unknown').length;
  const overallStatus =
    downCount === 0 && unknownCount === 0
      ? 'healthy'
      : downCount > checks.length / 2
        ? 'critical'
        : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
