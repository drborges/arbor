import { NodeHandler } from "./NodeHandler"
import { Seed } from "./Seed"
import { NotAnArborNodeError, ValueAlreadyBoundError } from "./errors"
import { isNode, isProxiable } from "./guards"
import type { Link, Node } from "./types"

export class MapNodeHandler<T extends object = object> extends NodeHandler<
  Map<unknown, T>
> {
  static accepts(value: unknown) {
    return value instanceof Map
  }

  *[Symbol.iterator]() {
    if (!isNode<Map<unknown, T>>(this)) throw new NotAnArborNodeError()

    for (const entry of this.entries()) {
      yield entry
    }
  }

  $traverse<C extends object>(link: Link): C {
    return (this as unknown as Map<unknown, T>).get(link) as unknown as C
  }

  $attach<C extends object>(link: Link, value: C) {
    this.$value.set(link, value as unknown as T)
  }

  deleteProperty(target: Map<string, T>, prop: string): boolean {
    const child = target.get(prop)

    this.$tree.detachNodeFor(child)
    this.$tree.mutate(this, (map) => {
      map.delete(prop)

      return {
        props: [prop],
        operation: "delete",
      }
    })

    return child != null
  }

  get(
    target: Map<unknown, T>,
    prop: string,
    proxy: Node<Map<unknown, T>>
  ): unknown {
    if (prop === "get") {
      return (key: string) => {
        const value = target.get(key)

        if (!isProxiable(value)) {
          return value
        }

        return this.$getOrCreateChild(key, value)
      }
    }

    if (prop === "set") {
      return (key: string, newValue: T) => {
        const value = isNode<T>(newValue) ? newValue.$value : newValue

        if (target.get(key) !== value) {
          const link = this.$tree.links.get(Seed.from(value))
          if (link && link !== key) {
            throw new ValueAlreadyBoundError()
          }

          this.$tree.mutate(this, (map) => {
            map.set(key, value)

            return {
              props: [key],
              operation: "set",
            }
          })
        }

        return this
      }
    }

    if (prop === "delete") {
      return (key: string) => {
        const child = target.get(key)

        delete proxy[key]

        return child != null
      }
    }

    if (prop === "clear") {
      return () => {
        this.$tree.mutate(this, (map) => {
          map.clear()

          return {
            props: [],
            operation: "clear",
          }
        })
      }
    }

    if (prop === "values") {
      return function* () {
        for (const key of target.keys()) {
          yield proxy.get(key)
        }
      }
    }

    if (prop === "entries") {
      return function* () {
        for (const key of target.keys()) {
          yield [key, proxy.get(key)]
        }
      }
    }

    return super.get(target, prop, proxy)
  }
}
