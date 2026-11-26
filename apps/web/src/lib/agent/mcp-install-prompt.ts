import { siteConfig } from "@/lib/site-config";

export const mcpServerUrl = `${siteConfig.url}/mcp`;

/** The install guide for the server, `mcpGuide`'s page. */
export const mcpInstallPath = "/install/mcp";

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

/** Pasted into a coding agent from a component's page, so it carries its own fallback for an agent without the server. */
export const mcpComponentPrompt = (
  slug: string,
) => `Add the ${slug} component from ${siteConfig.name} to this project.

Call get_component on the uicapsule MCP server with slug "${slug}". It returns the component's source, npm dependencies and the shadcn command that installs it. Install it, then adapt it to this codebase's conventions. To find related components, use search_components.

If the uicapsule tools are not available, add the server first: Streamable HTTP at ${mcpServerUrl}, no authentication. In Claude Code, run: ${mcpClaudeCodeCommand}
Setup for other agents: ${siteConfig.url}${mcpInstallPath}`;
