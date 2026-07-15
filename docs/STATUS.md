# Vitrum examples status

Last updated: 2026-07-15

Status: **one M1 developer prototype; no supported public-SDK examples yet.**

`node-widget` passes four Node contract tests and performs a real offscreen
Vitrum CPU render into a transparent PNG. It still uses a fixed DOM in the
Engine integration helper and has no HTML parser, page V8, Node-API, IPC, or
HWND target.

Verification:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check.ps1
```

PASS on 2026-07-15 with Node.js 22.14.0: 4/4 Node tests and one deterministic
420×260 `CpuVello` render through the sibling Engine selected by
`VITRUM_ENGINE_DIR`.

Next action: retain this prototype as an M1 visual regression while Engine
work continues; replace its helper with the public Node SDK after M5.
