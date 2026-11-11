/**
 * Wraps an async function so that calls made while an earlier call is pending are ignored and
 * resolve to undefined (AK-13). Once the call has succeeded or failed, a new call goes through.
 */
export function ignoreWhilePending<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R | undefined> {
  let pending = false
  return async (...args: A) => {
    if (pending) return undefined
    pending = true
    try {
      return await fn(...args)
    } finally {
      pending = false
    }
  }
}
