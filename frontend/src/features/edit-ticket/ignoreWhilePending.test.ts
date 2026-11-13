import { describe, expect, it, vi } from 'vitest'
import { ignoreWhilePending } from './ignoreWhilePending'

/** A promise the test resolves or rejects by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('ignoreWhilePending', () => {
  it('ignores a second call while the first is pending', async () => {
    const first = deferred<string>()
    const fn = vi.fn().mockReturnValue(first.promise)
    const save = ignoreWhilePending(fn)

    const firstCall = save()
    const secondCall = save()
    first.resolve('saved')

    expect(fn).toHaveBeenCalledOnce()
    await expect(firstCall).resolves.toBe('saved')
    await expect(secondCall).resolves.toBeUndefined()
  })

  it('accepts a new call after the first has finished', async () => {
    const fn = vi.fn().mockResolvedValue('saved')
    const save = ignoreWhilePending(fn)

    await save()
    await save()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('accepts a new call after the first has failed', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValue('saved')
    const save = ignoreWhilePending(fn)

    await save().catch(() => undefined)

    await expect(save()).resolves.toBe('saved')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
