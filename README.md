# UICapsule

A curated collection of components that spark joy

## Install a component

```bash
npx shadcn@latest add @uicapsule/<slug>
```

Browse [www.uicapsule.com](https://www.uicapsule.com) for slugs.

## MCP

One server, two jobs for your agent:

- **Build better UI.** Skills for motion, gestures, accessibility, typography, color, layout,
  copy and interface review, served over MCP's skills extension (`skills/list`).
- **Start from a component.** `search_components` and `get_component` find UICapsule components
  by what they do and return their source and shadcn install command.

Add it:

```bash
claude mcp add --transport http uicapsule https://www.uicapsule.com/mcp
```

Any client that speaks Streamable HTTP works with the same URL. Also listed in the
[MCP Registry](https://registry.modelcontextprotocol.io) as `com.uicapsule/components`.
