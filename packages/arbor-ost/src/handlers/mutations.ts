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

export function $push(items: unknown[]): Mutation<unknown[]> {
  return (target: unknown[]) => () => {
    const previousSize = target.length
    const affectedProps = items.map((_, i) => previousSize + i)
    target.push(...items)

    return {
      oldValue: undefined,
      newValue: items,
      operation: "push",
      props: affectedProps,
    }
  }
}

export function $pop(): Mutation<unknown[]> {
  return (target: unknown[]) => () => {
    const popped = target.pop()

    return {
      oldValue: popped,
      newValue: undefined,
      operation: "pop",
      props: [target.length],
    }
  }
}

export function $shift(): Mutation<unknown[]> {
  return (target: unknown[]) => () => {
    const shifted = target.shift()

    return {
      oldValue: shifted,
      newValue: target[0],
      operation: "shift",
      props: [0],
    }
  }
}
