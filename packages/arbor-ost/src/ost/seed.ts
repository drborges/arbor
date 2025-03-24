const nextSeed = (
  (seed = 0) =>
  () =>
    seed++
)()

/**
 * Uniquely identifies nodes within an OST instance.
 */
export class Seed {
  constructor(readonly value = nextSeed()) {}
}
