/** Every user-facing status or error string the ⌘K console shows or
 *  announces, in one place so the components, the lazy driver, and the e2e
 *  specs can never drift apart. Plain named constants (and tiny formatters
 *  for the messages that embed a value). The eager loader imports it too, so
 *  the bundler keeps the whole module in the eager chunk — keep it to
 *  strings only (no imports, no logic) so that stays a few hundred bytes. */

/** The lazy driver chunk could not be fetched, even after the one-time reload. */
export const LOAD_FAILED = "No se pudo cargar la consola. Recarga la página.";

/** The chunk loaded but mountConsole() threw — a bug a reload can't fix. */
export const MOUNT_FAILED = "No se pudo iniciar la consola.";

/** A command's side effect threw (e.g. a blocked popup). */
export const ACTION_FAILED = "No se pudo ejecutar el comando.";

export const THEME_UPDATED = "Tema actualizado.";

export const NO_RESULTS = "Sin resultados.";

export function resultCount(count: number): string {
  return `${count} resultado${count === 1 ? "" : "s"}.`;
}

export function emailCopied(email: string): string {
  return `Correo copiado al portapapeles: ${email}`;
}

export function copyFallback(email: string): string {
  return `No se pudo copiar automáticamente. Correo seleccionado: ${email}`;
}
