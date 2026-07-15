import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeVitrumFrame,
  encodeRgbaPng,
  inspectPng,
  premultipliedBgraToStraightRgba,
  widgetStateCss,
} from "./widget.mjs";

function frameContainer(pixel) {
  const encoded = Buffer.alloc(36);
  encoded.write("VTRMFRM1", 0, "ascii");
  encoded.writeUInt32LE(1, 8);
  encoded.writeUInt32LE(1, 12);
  encoded.writeUInt32LE(1, 16);
  encoded.writeUInt32LE(4, 20);
  encoded.writeUInt32LE(1, 24);
  encoded.writeUInt32LE(4, 28);
  Buffer.from(pixel).copy(encoded, 32);
  return encoded;
}

test("decodes and unpremultiplies Vitrum BGRA pixels", () => {
  const frame = decodeVitrumFrame(frameContainer([0, 0, 128, 128]));
  assert.equal(frame.width, 1);
  assert.equal(frame.height, 1);
  assert.deepEqual(
    [...premultipliedBgraToStraightRgba(frame.premultipliedBgra)],
    [255, 0, 0, 128],
  );
});

test("encodes a structurally valid RGBA PNG", () => {
  const png = encodeRgbaPng(1, 1, Buffer.from([255, 0, 0, 128]));
  const inspected = inspectPng(png);
  assert.deepEqual(
    inspected.chunks.map((chunk) => chunk.type),
    ["IHDR", "IDAT", "IEND"],
  );
  assert.deepEqual([...inspected.scanlines], [0, 255, 0, 0, 128]);
});

test("rejects corrupted frame metadata", () => {
  const encoded = frameContainer([0, 0, 0, 0]);
  encoded.writeUInt32LE(8, 20);
  assert.throws(() => decodeVitrumFrame(encoded), /metadata is inconsistent/);
});

test("emits bounded rectangle-only dynamic CSS", () => {
  const css = widgetStateCss({
    accent: [82, 225, 174],
    memoryRatio: 0.5,
    nodeRssRatio: 0.25,
    uptimeRatio: 0.75,
    sparks: [12, 18, 24, 30, 36, 42, 48, 54],
  });
  assert.match(css, /#meter-memory-fill \{ width: 77px;/);
  assert.match(css, /#spark-8 \{ top: 110px; height: 54px;/);
  assert.doesNotMatch(css, /url\(|@import|gradient|transform/);
});
