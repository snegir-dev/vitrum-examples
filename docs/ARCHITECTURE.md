# Examples architecture

Supported examples sit outside the Engine and consume only public Node, .NET,
C, or Rust embedding APIs. They demonstrate product behavior without owning
runtime, DOM, layout, or rendering logic.

The existing Node widget predates those SDKs. It is a developer-only M1 bridge
that discovers an Engine checkout through `VITRUM_ENGINE_DIR` (default:
`../engine` in the standard workspace) and launches the publish-disabled frame
helper. This exception must be removed when `@vitrum/node` exists.
