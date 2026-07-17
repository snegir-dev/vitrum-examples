# AGENTS.md

These instructions apply to Vitrum examples.

1. Read `docs/STATUS.md`, `docs/ROADMAP.md`, and the target example README.
2. Inspect this repository's Git status and preserve unrelated examples.
3. Supported examples use released public SDKs only.
4. A milestone prototype may use an environment-selected sibling helper only
   when its README and status explicitly name the missing production layers.
5. Never add WebView, Chromium, Electron, Servo, or framework-specific engine
   behavior.
6. Generated output, package caches, and local engine paths stay untracked.
7. Update status with exact tests and the path toward a supported SDK example.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
