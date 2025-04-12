import { Mutation, Node, Value } from "../types"

export function $set<V extends Value>(prop: keyof V, newValue: unknown): Mutation<V> {
  return ($node: Node<V>) => {
    Reflect.set($node.$value, prop, newValue, $node)

    return {
      args: [prop, newValue],
      operation: "set",
    }
  }
}

export function $delete<V extends Value>(prop: keyof V): Mutation<V> {
  return ($node: Node<V>) => {
    Reflect.deleteProperty($node.$value, prop)

    return {
      args: [prop],
      operation: "delete",
    }
  }
}
