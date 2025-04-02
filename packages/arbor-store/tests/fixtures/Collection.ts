import { proxiable } from "../../src/decorators"

@proxiable
export class Collection<T> extends Array<T> {
  push(...items: T[]): number {
    // Testing that super is bound to the correct context
    return super.push(...items)
  }
}
