import http from 'http';

/**
 * Make an HTTP request to the Docker Engine API over the local unix socket.
 * Requires /var/run/docker.sock to be mounted in the container.
 */
export async function fetchDockerAPI(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      socketPath: '/var/run/docker.sock',
      path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse Docker API response'));
          }
        } else {
          reject(new Error(`Docker API Error: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}
