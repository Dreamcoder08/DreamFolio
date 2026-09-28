import { test } from "node:test";
import assert from "node:assert/strict";
import { createFloatBuffer } from "../../src/lib/convergence/gl-resources.ts";

test("createFloatBuffer uploads and configures an attribute in order", () => {
  const calls: unknown[][] = [];
  const buffer = {} as WebGLBuffer;
  const data = new Float32Array([1, 2]);
  const gl = {
    ARRAY_BUFFER: 1,
    STATIC_DRAW: 2,
    FLOAT: 3,
    createBuffer: () => {
      calls.push(["createBuffer"]);
      return buffer;
    },
    bindBuffer: (...args: unknown[]) => calls.push(["bindBuffer", ...args]),
    bufferData: (...args: unknown[]) => calls.push(["bufferData", ...args]),
    enableVertexAttribArray: (...args: unknown[]) =>
      calls.push(["enableVertexAttribArray", ...args]),
    vertexAttribPointer: (...args: unknown[]) =>
      calls.push(["vertexAttribPointer", ...args]),
  } as unknown as WebGL2RenderingContext;

  assert.equal(createFloatBuffer(gl, 4, data, 2), buffer);
  assert.deepEqual(calls, [
    ["createBuffer"],
    ["bindBuffer", 1, buffer],
    ["bufferData", 1, data, 2],
    ["enableVertexAttribArray", 4],
    ["vertexAttribPointer", 4, 2, 3, false, 0, 0],
  ]);
});

test("createFloatBuffer does not upload or enable attributes when allocation fails", () => {
  const gl = {
    createBuffer: () => null,
  } as unknown as WebGL2RenderingContext;
  assert.equal(createFloatBuffer(gl, 0, new Float32Array(0), 1), null);
});
