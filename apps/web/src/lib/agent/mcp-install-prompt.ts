import { siteConfig } from "@/lib/site-config";

export const mcpServerUrl = `${siteConfig.url}/mcp`;

export const mcpClaudeCodeCommand = `claude mcp add --transport http uicapsule ${mcpServerUrl}`;

export const mcpConfigJson = JSON.stringify(
  { mcpServers: { uicapsule: { type: "http", url: mcpServerUrl } } },
  null,
  2,
);

/** Pasted into any coding agent, so it names the transport and a fallback config shape. */
export const mcpInstallPrompt = `Add the ${siteConfig.name} MCP server to your MCP configuration.

- Name: uicapsule
- Transport: Streamable HTTP
- URL: ${mcpServerUrl}
- No authentication required

In Claude Code, run: ${mcpClaudeCodeCommand}
Otherwise, add this to your MCP config file:
{ "mcpServers": { "uicapsule": { "type": "http", "url": "${mcpServerUrl}" } } }

It does two things: skills that help you build better UI (motion, accessibility, typography, color, layout, copy), listed through MCP's skills extension, and two read-only tools, search_components and get_component, that serve ${siteConfig.name} components as templates. Once it is installed, confirm both tools are available.`;
