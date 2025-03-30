import { Seed } from "./seed"

export class Path {
  readonly seeds: Seed[]

  private constructor(...seeds: Seed[]) {
    this.seeds = seeds
  }

  static root(seed = new Seed()) {
    return new Path(seed)
  }

  child(seed = new Seed()): Path {
    return new Path(...this.seeds.concat([seed]))
  }

  isRoot() {
    return this.seeds.length === 1
  }

  humanize(decorate: (s: Seed) => string = (s) => s.value.toString()) {
    return this.seeds.map((s) => decorate(s)).join(" -> ")
  }

  get parentSeed(): Seed {
    return this.seeds.at(-2)
  }

  get target() {
    return this.seeds.at(-1)
  }
}
