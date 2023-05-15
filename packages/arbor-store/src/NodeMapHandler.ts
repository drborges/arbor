import { INode } from "./Arbor"
import NodeHandler from "./NodeHandler"
import isNode from "./isNode"
import isProxiable from "./isProxiable"

export default class NodeMapHandler<
  T extends object = object
> extends NodeHandler<Map<unknown, T>> {
  static accepts(value: unknown) {
    return value instanceof Map
  }

  get(
    target: Map<unknown, T>,
    prop: string,
    proxy: INode<Map<unknown, T>>
  ): unknown {
    if (prop === "get") {
      return (key: string) => {
        const value = target.get(key)

        if (!isProxiable(value)) {
          return value
        }

        const node = this.$children.has(value)
          ? this.$children.get(value)
          : this.$createChildNode(key, value)

        return node as unknown as T
      }
    }

    if (prop === "set") {
      return (key: string, newValue: T) => {
        const value = isNode(newValue) ? (newValue.$unwrap() as T) : newValue

        if (target.get(key) !== value) {
          this.$tree.mutate(this, (map) => {
            map.set(key, value)

            return {
              props: [key],
              operation: "set",
            }
          })
        }

        return this as unknown as T
      }
    }

    if (prop === "delete") {
      return (key: string) => {
        const exists = target.has(key)

        this.$tree.mutate(this, (map) => {
          map.delete(key)

          return {
            props: [key],
            operation: "delete",
          }
        })

        return exists
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
