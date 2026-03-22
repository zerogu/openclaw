import type { Client } from "@buape/carbon";
import type { Agent } from "node:http";
import {
  GatewayPlugin,
  type APIGatewayBotInfo,
  type GatewayPluginOptions,
} from "@buape/carbon/gateway";
import WebSocket from "ws";

/**
 * GatewayPlugin subclass that routes the Discord WebSocket connection through a proxy.
 *
 * Overrides:
 * - createWebSocket(): passes a proxy HTTP agent to ws so the wss:// connection
 *   is tunneled through the proxy via HTTP CONNECT or SOCKS.
 * - registerClient(): pre-fetches gateway info using the proxy fetch so the
 *   parent class skips its own non-proxied fetch call.
 */
export class ProxiedGatewayPlugin extends GatewayPlugin {
  private proxyAgent: Agent;
  private proxyFetch: typeof fetch;

  constructor(
    options: GatewayPluginOptions,
    params: { proxyAgent: Agent; proxyFetch: typeof fetch },
    gatewayInfo?: APIGatewayBotInfo,
  ) {
    super(options, gatewayInfo);
    this.proxyAgent = params.proxyAgent;
    this.proxyFetch = params.proxyFetch;
  }

  protected override createWebSocket(url: string): WebSocket {
    if (!url) {
      throw new Error("Gateway URL is required");
    }
    return new WebSocket(url, { agent: this.proxyAgent });
  }

  override async registerClient(client: Client): Promise<void> {
    // Pre-fetch gateway info through the proxy so the parent class
    // (which uses global fetch without proxy) does not need to.
    if (!this.gatewayInfo) {
      const response = await this.proxyFetch("https://discord.com/api/v10/gateway/bot", {
        headers: { Authorization: `Bot ${client.options.token}` },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to get gateway info via proxy: ${response.status} ${response.statusText}`,
        );
      }
      this.gatewayInfo = (await response.json()) as APIGatewayBotInfo;
    }
    await super.registerClient(client);
  }
}
