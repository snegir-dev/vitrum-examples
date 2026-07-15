# Node.js system-pulse widget

This runnable example is a small, honest bridge over the pieces implemented in
M1. Node.js owns the example, samples system/process state, generates dynamic
CSS, and starts a separate Rust process. That process builds the canonical
Vitrum DOM, resolves the CSS through Blitz, lowers it to an immutable Vitrum
scene, and rasterizes it with Vello CPU. Node converts the stable
premultiplied-BGRA8 frame into `out/widget.png` using only built-in modules.

No WebView, Chromium, Electron, npm dependency, or second V8 is loaded into the
Node process.

## Run

From this directory:

```powershell
npm start
```

The standard Vitrum checkout layout discovers Engine at
`../../vitrum-engine`. For a standalone checkout, point the prototype at an
explicit compatible Engine repository:

```powershell
$env:VITRUM_ENGINE_DIR = "D:\path\to\vitrum-engine"
npm start
```

For reproducible colors and bar shapes:

```powershell
node .\widget.mjs --seed=42
```

The first run compiles the Rust example. Later runs reuse Cargo's build cache.
Generated files are written under `out/`.

Run the dependency-free Node contract tests with:

```powershell
npm test
```

## What this proves

```text
Node.js state + generated CSS
  -> separate Rust example process
  -> canonical vitrum-dom
  -> Blitz style/layout projection
  -> immutable Vitrum RenderScene
  -> Vello CPU
  -> premultiplied BGRA8
  -> Node.js PNG encoder
```

This is not the future `@vitrum/node` SDK or `vitrum-runtime.exe`. The Rust
frame helper belongs to the separate Engine repository and is selected only
for this explicitly named milestone prototype. M1 does not
yet contain the HTML parser, page V8/WebRealm, Node-API addon, named-pipe IPC,
or HWND/DirectComposition target. The DOM shape is therefore fixed by the Rust
test harness while Node controls live values through CSS. It produces an
offscreen image, not an interactive desktop window.

The current strict paint slice supports solid axis-aligned rectangles only.
Text, images, gradients, rounded corners, shadows, transforms, and content
clips deliberately reject the complete frame instead of silently rendering the
wrong result.
