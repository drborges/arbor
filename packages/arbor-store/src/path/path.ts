import { Seed } from "./seed"

export class Path {
  readonly seeds: Seed[]

  /**
   * Creates a new instance of Path.
   *
   * @param seeds list of node seeds representing a path within a state tree
   * @returns a new instance of Path.
   */
  private constructor(...seeds: Seed[]) {
    this.seeds = seeds
  }

  static root(seed: Seed) {
    return new Path(seed)
  }

  child(seed: Seed): Path {
    return new Path(...this.seeds.concat([seed]))
  }

  get parent(): Path {
    if (this.isRoot()) {
      return null
    }

    return new Path(...this.seeds.slice(0, this.seeds.length - 1))
  }

  /**
   * Checks if the path points to the root of a state tree.
   *
   * @returns true if the path points to the root of a state tree, false otherwise.
   */
  isRoot() {
    return this.seeds.length === 1
  }
}
