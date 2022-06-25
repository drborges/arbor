import { ArborNode } from "./Arbor"
import { ArborProxiable } from "./proxiable"

export type Record = {
  uuid: string
}

export default class Repository<T extends Record> {
  [uuid: string]: ArborNode<T>

  constructor(...items: T[]) {
    items.forEach(item => {
      this[item.uuid] = item
    })
  }

  get [ArborProxiable]() {
    return true
  }

  *[Symbol.iterator]() {
    for (const item of Object.values<ArborNode<T>>(this)) {
      yield item
    }
  }
}
