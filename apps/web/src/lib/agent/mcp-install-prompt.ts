import { siteConfig } from "@/lib/site-config";

export const mcpServerUrl = `${siteConfig.url}/mcp`;

/** Pasted into any coding agent, so it names the transport and a fallback config shape. */
export const mcpInstallPrompt = `Add the ${siteConfig.name} MCP server to your MCP configuration.

- Name: uicapsule
- Transport: Streamable HTTP
- URL: ${mcpServerUrl}
- No authentication required

In Claude Code, run: claude mcp add --transport http uicapsule ${mcpServerUrl}
Otherwise, add this to your MCP config file:
{ "mcpServers": { "uicapsule": { "type": "http", "url": "${mcpServerUrl}" } } }

It exposes two read-only tools: search_components and get_component. Once it is installed, confirm both tools are available.`;
