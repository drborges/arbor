import { isNode } from "./guards"

export const ArborSeed = Symbol.for("ArborSeed")

const nextSeed = (
  (seed = 0) =>
  () =>
    seed++
)()

/**
 * Every node added to the state tree gets a seed assigned to them.
 *
 * Seeds are the mechanism used by Arbor to track nodes across updates
 * allowing it to determine if two different node memory references are actually
 * the same nome if they have the same seed.
 */
export class Seed {
  constructor(readonly value = nextSeed()) {}

  static plant(value: object, seed?: Seed) {
    if (!Seed.from(value)) {
      Object.defineProperty(value, ArborSeed, {
        value: seed || new Seed(),
        writable: false,
        enumerable: false,
      })
    }

    return Seed.from(value)
  }

  static from(value: Seed | object) {
    if (value instanceof Seed) {
      return value
    }

    if (isNode(value)) {
      return value.$value[ArborSeed]
    }

    return value?.[ArborSeed]
  }
}
