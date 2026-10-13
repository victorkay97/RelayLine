import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';

/**
 * PRIVATE runner-only: exact URL allowlist + pinned IPv4 DNS resolution.
 * No user-controlled public probe endpoint. No redirects. TLS hostname verified.
 * HTTP responses 200–399 imply this HTTPS endpoint answered, NOT correctness or censorship.
 */
export function isPublicIPv4(value) {
  if (isIP(value) !== 4) return false;
  const [a, b, c] = value.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || (b === 0 && c === 0))) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

export async function monitorProbe(urlText, {
  approvedUrls, timeoutMs = 3000, resolve = lookup, requestImpl = request
} = {}) {
  if (!Array.isArray(approvedUrls) || approvedUrls.length === 0) throw new Error('No operator URL allowlist configured');
  const url = new URL(urlText);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Only authenticated HTTPS endpoints');
  if (!approvedUrls.includes(url.href)) throw new Error('Endpoint not in operator-controlled allowlist');
  if (isIP(url.hostname)) throw new Error('IP-literal monitoring targets disabled');
  if (url.port && url.port !== '443') throw new Error('Only port 443 allowed');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local') || !url.hostname.includes('.')) {
    throw new Error('Non-public hostname');
  }
  const answers = await resolve(url.hostname, { all: true, family: 4, verbatim: true });
  if (!answers?.length || answers.some(item => !isPublicIPv4(item.address))) {
    throw new Error('DNS destination is not entirely public IPv4');
  }
  const selectedIP = answers[0].address;
  return new Promise((resolveProbe, rejectProbe) => {
    const req = requestImpl(url, {
      method: 'HEAD', timeout: timeoutMs, agent: false,
      lookup: (_hostname, _options, callback) => callback(null, selectedIP, 4),
      headers: { 'user-agent': 'RelayLine-Controlled-Monitor/0.1' }
    }, response => {
      response.resume();
      resolveProbe({
        status: response.statusCode >= 200 && response.statusCode < 400 ? 'reachable' : 'unreachable',
        http_status: response.statusCode
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', error => rejectProbe(error));
    req.end();
  });
}
