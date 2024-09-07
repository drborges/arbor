import { NotAnArborNodeError } from "../errors"
import { isNode, isProxiable } from "../guards"
import type { Link, Node } from "../types"
import { DefaultHandler } from "./default"

export class MapHandler<T extends object = object> extends DefaultHandler<
  Map<unknown, T>
> {
  static accepts(value: unknown) {
    return value instanceof Map
  }

  *[Symbol.iterator]() {
    const mapProxy = this.$tree.getNodeFor(this) as unknown as Map<unknown, T>

    for (const entry of this.$value.entries()) {
      const childProxy = mapProxy.get(entry[0])
      yield [entry[0], childProxy]
    }
  }

  $getChildNode<C extends object>(link: Link): Node<C> {
    return (this as unknown as Map<unknown, T>).get(link) as unknown as Node<C>
  }

  $setChildValue<C extends object>(link: Link, value: C) {
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

        return this.$tree.traverse(proxy, key, value)
      }
    }

    if (prop === "set") {
      return (key: string, newValue: T) => {
        const currentValue = target.get(key)
        const value = isNode<T>(newValue) ? newValue.$value : newValue

        if (currentValue !== value) {
          if (currentValue != null) {
            this.$tree.detachNodeFor(target.get(key))
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
        for (const item of proxy.values()) {
          this.$tree.detachNodeFor(item)
        }

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
