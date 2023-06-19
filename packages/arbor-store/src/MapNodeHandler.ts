import { INode } from "./Arbor"
import NodeHandler from "./NodeHandler"
import { NotAnArborNodeError, ValueAlreadyBoundError } from "./errors"
import { isNode, isProxiable } from "./guards"

export default class MapNodeHandler<
  T extends object = object
> extends NodeHandler<Map<unknown, T>> {
  static accepts(value: unknown) {
    return value instanceof Map
  }

  $traverse(key: unknown) {
    if (!isNode<Map<unknown, T>>(this)) throw new NotAnArborNodeError()

    return this.get(key) as INode<T>
  }

  *[Symbol.iterator]() {
    if (!isNode<Map<unknown, T>>(this)) throw new NotAnArborNodeError()

    for (const entry of this.entries()) {
      yield entry
    }
  }

  deleteProperty(target: Map<string, T>, prop: string): boolean {
    const child = target.get(prop)

    this.$children.delete(child)
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
    proxy: INode<Map<unknown, T>>
  ): unknown {
    if (prop === "get") {
      return (key: string) => {
        const value = target.get(key)

        if (!isProxiable(value)) {
          return value
        }

        return this.$getOrCreateChildNode(key, value)
      }
    }

    if (prop === "set") {
      return (key: string, newValue: T) => {
        const value = isNode<T>(newValue) ? newValue.$unwrap() : newValue

        if (target.get(key) !== value) {
          if (this.$children.has(value)) {
            const node = this.$children.get(value)
            throw new ValueAlreadyBoundError(
              `Cannot set value to path ${this.$path
                .child(key)
                .toString()}. Value is already bound to path ${node.$path.toString()}.`
            )
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