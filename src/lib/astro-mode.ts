/**
 * Astro's mode resolution, mirrored.
 *
 * Astro never hands its resolved mode to `astro.config.mjs`, and it only sets
 * NODE_ENV when that is unset — never from `--mode`. So NODE_ENV is a proxy
 * that is wrong for custom modes: `astro build --mode staging` leaves NODE_ENV
 * as "production", and a value in `.env.staging` would then never reach the CSP
 * the config builds. It has to be read from the command line instead.
 *
 * Kept as a pure function, separate from the config file, so the contract is
 * testable: both `--mode staging` and `--mode=staging` are valid, and a flag
 * with no value falls back to the command's default.
 */
export function resolveMode(argv: string[], isDev: boolean): string {
  const flagIndex = argv.findIndex(
    (argument) => argument === "--mode" || argument.startsWith("--mode="),
  );

  let fromFlag: string | undefined;
  if (flagIndex !== -1) {
    const flag = argv[flagIndex];
    // Slice rather than split, so a mode containing "=" survives intact.
    fromFlag = flag.startsWith("--mode=")
      ? flag.slice("--mode=".length)
      : argv[flagIndex + 1];
  }

  // An empty value counts as absent: `--mode=` must not select `.env..local`.
  return (fromFlag || undefined) ?? (isDev ? "development" : "production");
}
