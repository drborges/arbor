import { ArborProxiable } from "./isProxiable"

export type Record = {
  uuid: string
}

export default class Repository<T extends Record> {
  [uuid: string]: T

  constructor(...items: T[]) {
    items.forEach(item => {
      this[item.uuid] = item
    })
  }

  get [ArborProxiable]() {
    return true
  }

  *[Symbol.iterator]() {
    for (const item of Object.values<T>(this)) {
      yield item
    }
  }
}
