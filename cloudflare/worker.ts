const ORACLE_ORIGIN = 'https://smart-time-ai.duckdns.org';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function shouldProxy(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith('/ws/') || pathname === '/check-email';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const incomingUrl = new URL(request.url);

    if (!shouldProxy(incomingUrl.pathname)) {
      return env.ASSETS.fetch(request);
    }

    const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, ORACLE_ORIGIN);
    try {
      const upstreamRequest = new Request(upstreamUrl.toString(), request);
      const upstreamResponse = await fetch(upstreamRequest);

      // WebSocket upgrade responses must be returned unchanged (Response cannot construct status 101).
      if (upstreamResponse.status === 101) return upstreamResponse;

      const headers = new Headers(upstreamResponse.headers);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
      });
    } catch {
      return new Response(JSON.stringify({
        ok: false,
        error: 'تعذر الاتصال بخادم التطبيق. حاول مرة أخرى لاحقًا.',
        upstream: 'oracle',
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }
  },
};
