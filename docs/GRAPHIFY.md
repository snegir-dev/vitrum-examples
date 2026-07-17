# Graphify

Graphify is project-local developer tooling. It is not an example runtime,
public SDK, or permission to turn a prototype into an Engine dependency. The
committed Codex integration is in `AGENTS.md`, `.codex/skills/graphify/`, and
`.codex/hooks.json`.

Install the CLI once for the current user:

```powershell
uv tool install graphifyy
```

From this repository, build the initial graph with the Codex skill
`$graphify .`. It writes local generated output to `graphify-out/`, which is
ignored by Git. Use it to navigate the examples without changing their support
status:

```powershell
graphify query "Which files make this example a temporary prototype?"
graphify path "node-widget" "VITRUM_ENGINE_DIR"
graphify update .
```

This graph contains only `vitrum-examples`. For a question spanning sibling
repositories, run `$graphify .` from the plain `Vitrum` parent directory; it
does not create a shared Git workspace or relax public-SDK boundaries. If the
Graphify executable moves, run `graphify codex install --project` here to
refresh the local Codex integration.
