import { Seed } from "./path/seed"

export class SeedMap<T> extends WeakMap<Seed, T> {
  getFor(value: object): T | undefined {
    return this.get(Seed.from(value))
  }
}
