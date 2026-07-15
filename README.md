# Vitrum examples

This repository owns sample widgets and host integrations. Supported examples
will consume released public SDKs; they must not become a second engine or
depend on implementation internals.

Current content:

- [`node-widget`](node-widget/README.md): an explicitly temporary M1 offscreen
  prototype. Node generates state/CSS, an environment-selected sibling Engine
  helper renders a frame, and Node writes a PNG. It is not `@vitrum/node`, does
  not execute page JS, and does not create an HWND.

Run all current example checks with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check.ps1
```
