const sieve = new Map()

/**
 * Generates prime numbers (also 0 and 1 which aren't primes but are needed for the algorithm)
 */
export function* primes() {
  yield 0
  yield 1
  yield 2
  yield 3
  yield 5
  yield 7

  const ps = primes()
  ps.next()
  ps.next()

  for (let p = 3, i = 9; true; i += 2) {
    let s = sieve.get(i)

    if (s !== undefined) {
      sieve.delete(i)
    } else if (i < p * p) {
      yield i
      continue
    } else {
      s = 2 * p
      p = ps.next().value!
    }

    let k = i + s
    while (sieve.has(k)) k += s
    sieve.set(k, s)
  }
}
