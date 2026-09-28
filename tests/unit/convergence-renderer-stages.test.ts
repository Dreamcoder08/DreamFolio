import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSoftwareRenderer,
  isSoftwareRendererName,
} from "../../src/lib/convergence/renderer-probe.ts";
import {
  computeAspectScale,
  computeLineAlpha,
  render,
  resize,
} from "../../src/lib/convergence/renderer-draw.ts";
import { buildLineVertices } from "../../src/lib/convergence/renderer-upload.ts";
import {
  createRendererState,
  type ConvergenceUniforms,
} from "../../src/lib/convergence/renderer-state.ts";
import {
  createFakeCanvas,
  createFakeGl,
  tinyField,
} from "./support/fake-webgl.ts";

test("isSoftwareRendererName matches software rasterizers only", () => {
  for (const name of [
    "ANGLE (Google, Vulkan 1.3 (SwiftShader Device), SwiftShader driver)",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "Software Rasterizer",
    "Microsoft Basic Render Driver",
  ]) {
    assert.equal(isSoftwareRendererName(name), true, name);
  }
  assert.equal(isSoftwareRendererName("ANGLE (NVIDIA GeForce RTX)"), false);
  assert.equal(isSoftwareRendererName(undefined), false);
  assert.equal(isSoftwareRendererName(42), false);
});

test("isSoftwareRenderer does not reject when the debug extension is missing", () => {
  assert.equal(isSoftwareRenderer(createFakeGl().gl), false);
  const soft = createFakeGl({ rendererName: "SwiftShader" }).gl;
  assert.equal(isSoftwareRenderer(soft), true);
  const real = createFakeGl({ rendererName: "Apple M2" }).gl;
  assert.equal(isSoftwareRenderer(real), false);
});

test("computeAspectScale keeps the short axis at 1", () => {
  assert.deepEqual(computeAspectScale(200, 100), [0.5, 1]);
  assert.deepEqual(computeAspectScale(100, 200), [1, 0.5]);
  assert.deepEqual(computeAspectScale(0, 100), [1, 1]);
});

test("computeLineAlpha ramps from progress 0.15 to 0.75 and scales by 0.8", () => {
  assert.equal(computeLineAlpha(0, 1), 0);
  assert.equal(computeLineAlpha(0.15, 1), 0);
  assert.equal(computeLineAlpha(1, 1), 0.8);
  assert.equal(computeLineAlpha(1, 0.5), 0.4);
});

test("buildLineVertices emits both hub endpoints per edge", () => {
  assert.deepEqual(
    [...buildLineVertices(tinyField())],
    [-0.5, 0.25, 0.5, -0.25],
  );
});

function uniforms(progress: number): ConvergenceUniforms {
  return {
    progress,
    time: 2,
    dpr: 1,
    pointer: [0.1, 0.2],
    pointerStrength: 0.3,
    idleAmount: 0.4,
    accent: [1, 0.5, 0],
    neutral: [0.9, 0.9, 0.9],
    alpha: 1,
    protectRects: new Float32Array(24),
    protectCount: 0,
  };
}

function readyState() {
  const fake = createFakeGl();
  const state = createRendererState(
    createFakeCanvas(fake.gl).canvas,
    fake.gl,
    tinyField,
    () => false,
  );
  state.program = { id: "points" };
  state.lineProgram = { id: "lines" };
  state.pointsVao = { id: "pointsVao" };
  state.lineVao = { id: "lineVao" };
  state.particleCount = 2;
  state.lineVertexCount = 2;
  state.uniformLocations = new Proxy(
    {},
    { get: (_t, p) => `points.${String(p)}` },
  );
  state.lineUniformLocations = new Proxy(
    {},
    { get: (_t, p) => `lines.${String(p)}` },
  );
  return { state, calls: fake.calls };
}

test("render draws lines before points with the original uniform order", () => {
  const { state, calls } = readyState();
  render(state, uniforms(1));
  assert.deepEqual(
    calls.map(([name, location]) =>
      name.startsWith("uniform") ? `${name}:${location}` : name,
    ),
    [
      "clearColor",
      "clear",
      "bindVertexArray",
      "useProgram",
      "uniform2f:lines.aspect",
      "uniform3f:lines.color",
      "uniform1f:lines.alpha",
      "uniform4fv:lines.protect",
      "uniform1i:lines.protectCount",
      "drawArrays",
      "bindVertexArray",
      "useProgram",
      "uniform1f:points.progress",
      "uniform1f:points.time",
      "uniform1f:points.dpr",
      "uniform2f:points.pointer",
      "uniform1f:points.pointerStrength",
      "uniform1f:points.idleAmount",
      "uniform2f:points.aspect",
      "uniform3f:points.accent",
      "uniform3f:points.neutral",
      "uniform1f:points.alpha",
      "uniform4fv:points.protect",
      "uniform1i:points.protectCount",
      "drawArrays",
    ],
  );
  const draws = calls.filter(([name]) => name === "drawArrays");
  assert.deepEqual(draws, [
    ["drawArrays", "LINES", 0, 2],
    ["drawArrays", "POINTS", 0, 2],
  ]);
});

test("render skips the line pass at chaos and draws nothing when gated", () => {
  const { state, calls } = readyState();
  render(state, uniforms(0));
  assert.deepEqual(
    calls.filter(([name]) => name === "drawArrays"),
    [["drawArrays", "POINTS", 0, 2]],
  );

  for (const gate of ["contextLost", "disposed"] as const) {
    const gated = readyState();
    gated.state[gate] = true;
    render(gated.state, uniforms(1));
    assert.deepEqual(gated.calls, [], gate);
  }
});

test("resize sizes the backing store and stores the aspect scale", () => {
  const { state, calls } = readyState();
  resize(state, 200, 100, 2);
  assert.equal(state.canvas.width, 400);
  assert.equal(state.canvas.height, 200);
  assert.deepEqual(calls, [["viewport", 0, 0, 400, 200]]);
  assert.deepEqual([state.aspectX, state.aspectY], [0.5, 1]);
});
