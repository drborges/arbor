import { Mutation, Node, Value } from "../types"

export function $set<V extends Value>(prop: keyof V, newValue: unknown): Mutation<V> {
  return (target: V, $node?: Node<V>) => () => {
    const oldValue = target[prop]

    Reflect.set(target, prop, newValue, $node)

    return {
      oldValue,
      newValue,
      operation: "set",
      props: [prop],
    }
  }
}

export function $delete<V extends Value>(prop: keyof V): Mutation<V> {
  return (target: V) => () => {
    const oldValue = target[prop]

    Reflect.deleteProperty(target, prop)

    return {
      oldValue,
      newValue: undefined,
      operation: "delete",
      props: [prop],
    }
  }
}
