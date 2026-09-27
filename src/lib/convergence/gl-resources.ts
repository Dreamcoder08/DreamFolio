/** Yields the main thread back to the browser for one turn — the unit this
 * module's chunked mount (see `build` in `createRenderer`) is split into.
 * Prefers the standardized `scheduler.yield()` where available (resumes at
 * normal task priority as soon as the queue is clear); falls back to a
 * plain `setTimeout(0)` macrotask everywhere else. Never `requestAnimation
 * Frame`: that ties resumption to the display's refresh rate (and pauses
 * entirely on a backgrounded/off-screen tab), where a mount step has no
 * reason to wait that long or stall just because the hero has scrolled
 * out of view mid-mount. */
export function yieldToMain(): Promise<void> {
  const scheduler = (
    globalThis as { scheduler?: { yield?: () => Promise<void> } }
  ).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Bounds how many turns `compileProgramAsync` will wait for
 * `KHR_parallel_shader_compile` to report a program complete before giving
 * up and reading `LINK_STATUS` anyway — a synchronous
 * `getProgramParameter(program, gl.LINK_STATUS)` read always blocks the
 * calling thread until the driver actually finishes compiling and linking,
 * whether or not this loop already spent turns polling
 * `COMPLETION_STATUS_KHR` first, so a driver that never flips that flag just
 * falls back to the same blocking read this module has to make eventually
 * either way. 300 turns is a generous ceiling (many seconds even at the slow
 * end of `yieldToMain`'s fallback cadence): a real compile is expected to
 * finish in a handful of turns at most, this only guards against a driver
 * bug that never reports completion. */
const MAX_COMPILE_POLL_ATTEMPTS = 300;

/**
 * Compiles and links one program without blocking the main thread for the
 * whole duration when the driver exposes `KHR_parallel_shader_compile`:
 * `compileShader`/`linkProgram` below still return immediately either way
 * (that part of the GL API was never synchronous), but the OLD synchronous
 * `compileProgram` immediately followed them with `getProgramParameter(...,
 * LINK_STATUS)` — reading compile/link status is what actually forces the
 * driver to finish the work right now, on this thread, if it hasn't
 * already. Polling `COMPLETION_STATUS_KHR` across yielded turns instead
 * lets a background compiler thread do that work while this thread's mount
 * step stays a series of small (sub-frame) turns instead of one task held
 * for the full compile+link duration — the thing T4f exists to fix. On a
 * driver without the extension, this falls through immediately and reads
 * `LINK_STATUS` right away, identical to the previous synchronous
 * behavior (no regression, just no parallelism to exploit).
 *
 * `shouldAbort` is polled between turns so a mount that's been cancelled
 * (the hero unmounted, the page navigated away) stops spending any more
 * turns waiting on a compile nobody will ever use.
 */
export async function compileProgramAsync(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  shouldAbort: () => boolean,
): Promise<WebGLProgram | null> {
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.shaderSource(vertex, vertexSource);
  gl.shaderSource(fragment, fragmentSource);
  gl.compileShader(vertex);
  gl.compileShader(fragment);

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  const parallelCompile = gl.getExtension("KHR_parallel_shader_compile");
  if (parallelCompile) {
    let attempts = 0;
    while (
      attempts < MAX_COMPILE_POLL_ATTEMPTS &&
      !shouldAbort() &&
      !gl.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR)
    ) {
      await yieldToMain();
      attempts += 1;
    }
  }

  // Shaders are flagged for delete-on-detach; the program itself keeps them
  // alive until it is deleted.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (shouldAbort() || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function createFloatBuffer(
  gl: WebGL2RenderingContext,
  location: number,
  data: Float32Array,
  size: 1 | 2,
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  return buffer;
}
