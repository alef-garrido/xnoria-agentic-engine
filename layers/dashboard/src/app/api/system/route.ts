import { NextResponse } from "next/server";
import {
  fetchDockerAPI,
  findContainer,
  listProjectServiceNames,
  type DockerContainer,
} from "@/lib/docker";
import os from "os";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const containers = await fetchDockerAPI<DockerContainer[]>("/containers/json?all=true");

    const targetServices = listProjectServiceNames();

    const services = targetServices.map((target) => {
      // Find container ignoring leading slash in name
      const container = findContainer(containers, target);

      if (!container) {
        return {
          name: target,
          status: "missing",
          uptime: "0s",
          restartCount: 0,
        };
      }

      const isRunning = container.State === "running";

      return {
        name: target,
        status: isRunning ? "running" : container.State,
        uptime: container.Status,
        restartCount: container.RestartCount || 0, // (Requires deeper inspect if not exposed here, but we default to zero if absent)
      };
    });

    const hostMetrics = {
      cpuPercent: os.loadavg()[0], // simplified 1m load average representation
      ramUsed: os.totalmem() - os.freemem(),
      ramTotal: os.totalmem(),
      diskUsed: 0, // Placeholder, requires more complex host mounting for exact disk usage
      diskTotal: 0,
    };

    return NextResponse.json({
      services,
      host: hostMetrics,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch system stats from Docker API");
    return NextResponse.json({ error: "Failed to fetch system stats" }, { status: 500 });
  }
}
