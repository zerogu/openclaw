import type { Agent } from "node:http";
import { wrapFetchWithAbortSignal } from "openclaw/plugin-sdk/fetch-runtime";
import { ProxyAgent } from "proxy-agent";
import { ProxyAgent as UndiciProxyAgent, fetch as undiciFetch } from "undici";

/** Create a proxy-aware fetch for Discord REST API calls (undici ProxyAgent). */
export function makeDiscordProxyFetch(proxyUrl: string): typeof fetch {
  const agent = new UndiciProxyAgent(proxyUrl);
  const fetcher = ((input: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(input as string | URL, {
      ...(init as Record<string, unknown>),
      dispatcher: agent,
    }) as unknown as Promise<Response>) as typeof fetch;
  return wrapFetchWithAbortSignal(fetcher);
}

/**
 * Create an HTTP agent that tunnels WebSocket connections through a proxy.
 * Uses proxy-agent which auto-detects the proxy protocol (http, https, socks4, socks5).
 * The returned agent is passed to the ws WebSocket constructor via `{ agent }`.
 */
export function makeDiscordProxyWsAgent(proxyUrl: string): Agent {
  return new ProxyAgent({ getProxyForUrl: () => proxyUrl }) as unknown as Agent;
}

/**
 * Patch globalThis.fetch so that requests to discord.com are routed through
 * the proxy while everything else uses the original fetch.
 *
 * This is needed because @buape/carbon's RequestClient calls the global
 * fetch() directly with no injection point for a custom implementation.
 * The patch is URL-scoped: only discord.com traffic is affected.
 */
export function installDiscordProxyFetch(proxyFetch: typeof fetch): void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("discord.com/")) {
      return proxyFetch(input, init);
    }
    return originalFetch.call(globalThis, input, init);
  }) as typeof fetch;
}
