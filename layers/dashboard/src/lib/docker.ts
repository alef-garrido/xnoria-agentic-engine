import http from "http";

export interface DockerContainer {
  Names: string[];
  State: string;
  Status: string;
  RestartCount: number;
}

/** The core project services surfaced in system/health views (single source). */
export function listProjectServiceNames(projectId?: string): string[] {
  const id = projectId || process.env.PROJECT_ID || "exnoria";
  return [`${id}_postgres`, `${id}_n8n`, `${id}_filter`, `${id}_cognitive`];
}

/** Find a container by its name ignoring the leading slash Docker prefixes. */
export function findContainer(
  containers: DockerContainer[],
  target: string
): DockerContainer | undefined {
  return containers.find((c) => c.Names.some((n: string) => n === `/${target}`));
}

/**
 * Make an HTTP request to the Docker Engine API over the local unix socket.
 * Requires /var/run/docker.sock to be mounted in the container.
 */
export async function fetchDockerAPI<T = unknown>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const options = {
      socketPath: "/var/run/docker.sock",
      path,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Failed to parse Docker API response"));
          }
        } else {
          reject(new Error(`Docker API Error: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}
