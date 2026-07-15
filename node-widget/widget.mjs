import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

export const FRAME_WIDTH = 420;
export const FRAME_HEIGHT = 260;

const FRAME_MAGIC = Buffer.from("VTRMFRM1", "ascii");
const FRAME_HEADER_BYTES = 32;
const FRAME_VERSION = 1;
const BGRA8_PREMULTIPLIED_SRGB = 1;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, "..", "..");
const engineRoot = resolve(process.env.VITRUM_ENGINE_DIR ?? resolve(workspaceRoot, "engine"));
const outputDirectory = resolve(here, "out");

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

export function decodeVitrumFrame(encoded) {
  if (!Buffer.isBuffer(encoded) || encoded.length < FRAME_HEADER_BYTES) {
    throw new Error("Vitrum frame container is truncated");
  }
  if (!encoded.subarray(0, FRAME_MAGIC.length).equals(FRAME_MAGIC)) {
    throw new Error("Vitrum frame container has an invalid magic value");
  }

  const version = encoded.readUInt32LE(8);
  const width = encoded.readUInt32LE(12);
  const height = encoded.readUInt32LE(16);
  const stride = encoded.readUInt32LE(20);
  const format = encoded.readUInt32LE(24);
  const pixelLength = encoded.readUInt32LE(28);

  if (version !== FRAME_VERSION) {
    throw new Error(`Unsupported Vitrum frame version ${version}`);
  }
  if (format !== BGRA8_PREMULTIPLIED_SRGB) {
    throw new Error(`Unsupported Vitrum pixel format ${format}`);
  }
  if (width === 0 || height === 0 || width > 4096 || height > 4096) {
    throw new Error("Vitrum frame dimensions are outside the example limits");
  }
  if (stride !== width * 4 || pixelLength !== stride * height) {
    throw new Error("Vitrum frame metadata is inconsistent");
  }
  if (encoded.length !== FRAME_HEADER_BYTES + pixelLength) {
    throw new Error("Vitrum frame pixel payload has the wrong length");
  }

  return {
    width,
    height,
    stride,
    premultipliedBgra: encoded.subarray(FRAME_HEADER_BYTES),
  };
}

export function premultipliedBgraToStraightRgba(premultipliedBgra) {
  if (premultipliedBgra.length % 4 !== 0) {
    throw new Error("BGRA payload must contain complete pixels");
  }
  const rgba = Buffer.allocUnsafe(premultipliedBgra.length);
  for (let offset = 0; offset < premultipliedBgra.length; offset += 4) {
    const blue = premultipliedBgra[offset];
    const green = premultipliedBgra[offset + 1];
    const red = premultipliedBgra[offset + 2];
    const alpha = premultipliedBgra[offset + 3];
    rgba[offset] = unpremultiply(red, alpha);
    rgba[offset + 1] = unpremultiply(green, alpha);
    rgba[offset + 2] = unpremultiply(blue, alpha);
    rgba[offset + 3] = alpha;
  }
  return rgba;
}

function unpremultiply(channel, alpha) {
  if (alpha === 0) {
    return 0;
  }
  return Math.min(255, Math.round((channel * 255) / alpha));
}

export function encodeRgbaPng(width, height, rgba) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error("PNG dimensions must be positive safe integers");
  }
  if (!Buffer.isBuffer(rgba) || rgba.length !== width * height * 4) {
    throw new Error("PNG RGBA payload has the wrong length");
  }

  const scanlines = Buffer.allocUnsafe(height * (width * 4 + 1));
  for (let row = 0; row < height; row += 1) {
    const scanlineOffset = row * (width * 4 + 1);
    const sourceOffset = row * width * 4;
    scanlines[scanlineOffset] = 0;
    rgba.copy(scanlines, scanlineOffset + 1, sourceOffset, sourceOffset + width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type, payload) {
  const typeBuffer = Buffer.from(type, "ascii");
  const chunk = Buffer.allocUnsafe(12 + payload.length);
  chunk.writeUInt32BE(payload.length, 0);
  typeBuffer.copy(chunk, 4);
  payload.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(typeBuffer, payload), 8 + payload.length);
  return chunk;
}

function crc32(...buffers) {
  let crc = 0xffffffff;
  for (const buffer of buffers) {
    for (const byte of buffer) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function inspectPng(png) {
  if (!png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("Invalid PNG signature");
  }
  const chunks = [];
  let offset = PNG_SIGNATURE.length;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + length;
    const chunkEnd = payloadEnd + 4;
    if (chunkEnd > png.length) {
      throw new Error("Truncated PNG chunk");
    }
    chunks.push({ type, payload: png.subarray(payloadStart, payloadEnd) });
    offset = chunkEnd;
  }
  return {
    chunks,
    scanlines: inflateSync(Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.payload))),
  };
}

export function createWidgetState(seed = Date.now()) {
  const random = xorshift32(Number(seed) >>> 0 || 1);
  const memoryRatio = clamp(1 - os.freemem() / os.totalmem(), 0.08, 0.98);
  const nodeRssRatio = clamp(process.memoryUsage().rss / (512 * 1024 * 1024), 0.05, 0.98);
  const uptimeRatio = clamp((os.uptime() % 86400) / 86400, 0.08, 0.98);
  const accents = [
    [82, 225, 174],
    [91, 192, 255],
    [166, 124, 255],
    [255, 164, 91],
  ];
  const accent = accents[Math.floor(random() * accents.length)];
  const sparks = Array.from({ length: 8 }, () => 12 + Math.floor(random() * 58));
  return { accent, memoryRatio, nodeRssRatio, uptimeRatio, sparks };
}

function xorshift32(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 0x100000000;
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function widgetStateCss(state) {
  const [red, green, blue] = state.accent;
  const fillWidth = (ratio) => Math.round(154 * ratio);
  const lines = [
    `#shadow { background-color: rgba(${red}, ${green}, ${blue}, 0.15); }`,
    `#accent, #status, #footer-dot { background-color: rgb(${red}, ${green}, ${blue}); }`,
    `#meter-memory-fill { width: ${fillWidth(state.memoryRatio)}px; background-color: rgb(${red}, ${green}, ${blue}); }`,
    `#meter-node-fill { width: ${fillWidth(state.nodeRssRatio)}px; background-color: rgba(${red}, ${green}, ${blue}, 0.82); }`,
    `#meter-uptime-fill { width: ${fillWidth(state.uptimeRatio)}px; background-color: rgba(${red}, ${green}, ${blue}, 0.58); }`,
  ];
  state.sparks.forEach((height, index) => {
    const top = 164 - height;
    const alpha = (0.35 + index * 0.07).toFixed(2);
    lines.push(`#spark-${index + 1} { top: ${top}px; height: ${height}px; background-color: rgba(${red}, ${green}, ${blue}, ${alpha}); }`);
  });
  return `${lines.join("\n")}\n`;
}

function parseSeed(arguments_) {
  const option = arguments_.find((argument) => argument.startsWith("--seed="));
  if (option === undefined) {
    return Date.now();
  }
  const seed = Number(option.slice("--seed=".length));
  if (!Number.isSafeInteger(seed)) {
    throw new Error("--seed must be a safe integer");
  }
  return seed;
}

export function main(arguments_ = process.argv.slice(2)) {
  if (!existsSync(resolve(engineRoot, "Cargo.toml"))) {
    throw new Error(
      `Vitrum Engine was not found at ${engineRoot}. Set VITRUM_ENGINE_DIR to its repository root.`,
    );
  }
  mkdirSync(outputDirectory, { recursive: true });
  const state = createWidgetState(parseSeed(arguments_));
  const stateCssPath = resolve(outputDirectory, "state.css");
  const framePath = resolve(outputDirectory, "widget.vtframe");
  const pngPath = resolve(outputDirectory, "widget.png");
  writeFileSync(stateCssPath, widgetStateCss(state), "utf8");

  const cargo = spawnSync(
    "cargo",
    [
      "run",
      "--quiet",
      "-p",
      "vitrum-integration-tests",
      "--example",
      "node_widget_frame",
      "--",
      resolve(here, "widget.css"),
      stateCssPath,
      framePath,
      String(FRAME_WIDTH),
      String(FRAME_HEIGHT),
    ],
    {
      cwd: engineRoot,
      shell: false,
      stdio: "inherit",
      windowsHide: true,
    },
  );
  if (cargo.error !== undefined) {
    throw cargo.error;
  }
  if (cargo.status !== 0) {
    throw new Error(`Vitrum renderer exited with status ${cargo.status}`);
  }

  const frame = decodeVitrumFrame(readFileSync(framePath));
  const rgba = premultipliedBgraToStraightRgba(frame.premultipliedBgra);
  writeFileSync(pngPath, encodeRgbaPng(frame.width, frame.height, rgba));

  console.log(
    `Node widget rendered: RAM ${Math.round(state.memoryRatio * 100)}%, ` +
      `Node RSS ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MiB`,
  );
  console.log(`PNG: ${pngPath}`);
  return pngPath;
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  main();
}
