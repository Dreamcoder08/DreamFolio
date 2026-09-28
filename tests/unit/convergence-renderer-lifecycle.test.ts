import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRenderer,
  WEBGL_CONTEXT_ATTRIBUTES,
} from "../../src/lib/convergence/renderer.ts";
import {
  createFakeCanvas,
  createFakeGl,
  settle,
  tinyField,
} from "./support/fake-webgl.ts";

const lost = () => new Event("webglcontextlost", { cancelable: true });
const restored = () => new Event("webglcontextrestored");

test("createRenderer requests the documented context attributes", async () => {
  const fake = createFakeGl();
  const { canvas, contextRequests } = createFakeCanvas(fake.gl);
  assert.ok(await createRenderer(canvas, tinyField));
  assert.deepEqual(contextRequests, [["webgl2", WEBGL_CONTEXT_ATTRIBUTES]]);
  assert.equal(WEBGL_CONTEXT_ATTRIBUTES.failIfMajorPerformanceCaveat, true);
});

test("createRenderer rejects no-WebGL2 and software renderers before building the field", async () => {
  let builds = 0;
  const buildField = () => {
    builds += 1;
    return tinyField();
  };
  assert.equal(
    await createRenderer(createFakeCanvas(null).canvas, buildField),
    null,
  );
  const soft = createFakeGl({ rendererName: "llvmpipe (LLVM 15)" });
  assert.equal(
    await createRenderer(createFakeCanvas(soft.gl).canvas, buildField),
    null,
  );
  assert.equal(builds, 0);
});

test("a failed first build returns null and never attaches listeners", async () => {
  const fake = createFakeGl({ linkOk: false });
  const { canvas, listenerLog } = createFakeCanvas(fake.gl);
  assert.equal(await createRenderer(canvas, tinyField), null);
  assert.deepEqual(listenerLog, []);
});

test("shouldAbort stops the yielded build before the field is generated", async () => {
  let builds = 0;
  const fake = createFakeGl();
  const { canvas } = createFakeCanvas(fake.gl);
  const renderer = await createRenderer(
    canvas,
    () => {
      builds += 1;
      return tinyField();
    },
    undefined,
    () => true,
  );
  assert.equal(renderer, null);
  assert.equal(builds, 0);
});

test("the build yields, then compiles, uploads and sets blend state", async () => {
  const fake = createFakeGl();
  const { canvas, listenerLog } = createFakeCanvas(fake.gl);
  assert.ok(await createRenderer(canvas, tinyField));
  const names = fake.calls.map(([name]) => name);
  assert.equal(names.filter((n) => n === "linkProgram").length, 2);
  assert.deepEqual(names.slice(-4), [
    "disable",
    "disable",
    "enable",
    "blendFunc",
  ]);
  assert.deepEqual(listenerLog, [
    "add:webglcontextlost",
    "add:webglcontextrestored",
  ]);
});

test("only the newest restore finalizes when the context is lost mid-rebuild", async () => {
  const fake = createFakeGl();
  const { canvas } = createFakeCanvas(fake.gl);
  const outcomes: boolean[] = [];
  const renderer = await createRenderer(canvas, tinyField, (ok) =>
    outcomes.push(ok),
  );
  assert.ok(renderer);

  const firstLoss = lost();
  canvas.dispatchEvent(firstLoss);
  assert.equal(firstLoss.defaultPrevented, true);
  canvas.dispatchEvent(restored());
  canvas.dispatchEvent(lost());
  canvas.dispatchEvent(restored());

  fake.calls.length = 0;
  renderer.render({
    progress: 1,
    time: 0,
    dpr: 1,
    pointer: [0, 0],
    pointerStrength: 0,
    idleAmount: 0,
    accent: [1, 1, 1],
    neutral: [1, 1, 1],
    alpha: 1,
    protectRects: new Float32Array(24),
    protectCount: 0,
  });
  assert.deepEqual(fake.calls, [], "render stays gated during the rebuild");

  await settle();
  assert.deepEqual(outcomes, [true]);
});

test("a failed setField upload disposes and removes the listeners", async () => {
  const fake = createFakeGl();
  const { canvas, listenerLog } = createFakeCanvas(fake.gl);
  const renderer = await createRenderer(canvas, tinyField);
  assert.ok(renderer);

  fake.state.failBuffers = true;
  assert.equal(renderer.setField(tinyField()), false);
  assert.deepEqual(listenerLog.slice(-2), [
    "remove:webglcontextlost",
    "remove:webglcontextrestored",
  ]);
  assert.equal(
    fake.calls.filter(([name]) => name === "deleteProgram").length,
    2,
  );
  const afterLoss = lost();
  canvas.dispatchEvent(afterLoss);
  assert.equal(afterLoss.defaultPrevented, false);
  assert.equal(renderer.setField(tinyField()), false);
});

test("a failed restore rebuild disposes and reports false", async () => {
  const fake = createFakeGl();
  const { canvas, listenerLog } = createFakeCanvas(fake.gl);
  const outcomes: boolean[] = [];
  const renderer = await createRenderer(canvas, tinyField, (ok) =>
    outcomes.push(ok),
  );
  assert.ok(renderer);

  fake.state.failBuffers = true;
  canvas.dispatchEvent(lost());
  canvas.dispatchEvent(restored());
  await settle();
  assert.deepEqual(outcomes, [false]);
  assert.equal(listenerLog.at(-1), "remove:webglcontextrestored");
});
