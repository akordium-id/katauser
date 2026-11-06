import { describe, it, expect, vi } from 'vitest';
import { createApiClient } from '../src/lib/api';

describe('SvelteKit Hono RPC Client', () => {
  it('instantiates the client and attaches Authorization header when token is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', service: 'katauser-api' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = createApiClient(mockFetch as any, 'test-jwt-token', 'http://localhost:4000');
    expect(client).toBeDefined();

    const res = await client.api.v1.health.$get();
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();

    const fetchCall = mockFetch.mock.calls[0];
    const headers = fetchCall[1]?.headers;
    const authHeader = headers instanceof Headers ? headers.get('Authorization') : headers?.Authorization;
    expect(authHeader).toBe('Bearer test-jwt-token');
  });

  it('works without token for public endpoints', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = createApiClient(mockFetch as any, undefined, 'http://localhost:4000');
    const res = await client.api.v1.health.$get();
    expect(res.status).toBe(200);

    const fetchCall = mockFetch.mock.calls[0];
    const headers = fetchCall[1]?.headers;
    const authHeader = headers instanceof Headers ? headers.get('Authorization') : headers?.Authorization;
    expect(authHeader).toBeFalsy();
  });
});

