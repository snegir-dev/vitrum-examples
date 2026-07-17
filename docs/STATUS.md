# Vitrum examples status

Last updated: 2026-07-17

Status: **one M1 developer prototype; no supported public-SDK examples yet.**

The canonical repository and checkout directory name is `vitrum-examples`.

Graphify is installed as project-scoped Codex tooling. Its generated
`graphify-out/` directory is ignored, and `docs/GRAPHIFY.md` keeps its use
separate from the status of supported examples.

`node-widget` passes four Node contract tests and performs a real offscreen
Vitrum CPU render into a transparent PNG. It still uses a fixed DOM in the
Engine integration helper and has no HTML parser, page V8, Node-API, IPC, or
HWND target.

Verification:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check.ps1
```

PASS on 2026-07-15 with Node.js 22.14.0 after the canonical directory rename:
4/4 Node tests and one deterministic 420×260 `CpuVello` render. With
`VITRUM_ENGINE_DIR` unset, the example correctly discovered the sibling
`vitrum-engine` repository through its default path.

Graphify integration PASS on 2026-07-17: `graphify --version` reported
`0.8.50`; `graphify codex install --project` created the project-scoped Codex
skill and hook; and the generated `graphify-out/` path is ignored. This is
tooling verification only and does not change example support status.

Next action: retain this prototype as an M1 visual regression while Engine
work continues; replace its helper with the public Node SDK after M5.
