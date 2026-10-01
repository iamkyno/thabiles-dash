/**
 * An expected failure whose message is safe to show the user (e.g. "Not enough stock for X").
 * Next.js replaces thrown errors' messages with a generic one in production builds, so actions
 * catch these via `runAction` and return the message as a value instead of throwing it.
 */
export class UserError extends Error {}

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    throw err;
  }
}
