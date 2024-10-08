import { ArborError, DetachedNodeError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"
import { Path, Seed } from "./path"
import type { ArborNode, Node } from "./types"

/**
 * Detaches a given ArborNode from the state tree.
 *
 * Can be used to simulate removing data from the store.
 *
 * @param node node to be detached from the state tree.
 * @returns the value wrapped by the node.
 */
export function detach<T extends object>(node: ArborNode<T>): T {
  if (!isNode<T>(node)) {
    throw new NotAnArborNodeError()
  }

  if (isDetached(node)) {
    throw new DetachedNodeError()
  }

  const path = pathFor(node)

  if (path.isRoot()) {
    throw new ArborError("Cannot detach store's root node")
  }

  const link = node.$tree.getLinkFor(node)
  const parentNode = node.$tree.getNodeAt<Node>(path.parent)
  delete parentNode[link]

  return node.$value
}

/**
 * Merges multiple attributes into a given ArborNode.
 *
 * This operations triggers a single mutation notification.
 *
 * @param node node to merge data into.
 * @param data data to merge into the node.
 * @returns the updated ArborNode.
 */
export function merge<T extends object>(
  node: ArborNode<T>,
  data: Partial<T>
): ArborNode<T> {
  if (!isNode<T>(node)) {
    throw new NotAnArborNodeError()
  }

  if (isDetached(node)) {
    throw new DetachedNodeError()
  }

  node.$tree.mutate(node, (value) => {
    Object.assign(value, data)
    return {
      operation: "merge",
      props: Object.keys(data),
    }
  })

  return node.$tree.getNodeAt(pathFor(node))
}

/**
 * Determines the node's path within the state tree.
 *
 * @param node the node to determine the path for.
 * @returns the path of the node within the state tree.
 */
export function pathFor<T extends object>(value: unknown): Path {
  if (!isNode<T>(value)) {
    throw new NotAnArborNodeError()
  }

  if (isDetached(value)) {
    throw new DetachedNodeError()
  }

  return value.$tree.getPathFor(value)
}

/**
 * Checks if node is no longer in the state tree.
 *
 * @param node the node to check whether it's detached from the state tree.
 * @returns true if node is no longer in the state tree, false otherwise.
 */
export function isDetached<T extends object>(node: T): boolean {
  // TODO: we need to walk the node's path and check if any intermediary node is detached
  // this would cover cases where one may have a stale reference to a node deep in the OST
  // but an ancestor has been detached.'
  if (!isNode(node)) return true

  return !node.$tree.getLinkFor(node) && !node.$tree.getNodeFor<Node>(node)
}

/**
 * Retrieves the value wrapped by the given state tree node.
 *
 * Nodes in Arbor are basically proxies of to objects within the state tree.
 * Unwrapping a node gives you back the "raw" value referenced by the node.
 *
 * @param node node to unwrap.
 * @returns the value wrapped by the node.
 */
export function unwrap<T extends object>(node: ArborNode<T>): T {
  if (!isNode<T>(node)) throw new NotAnArborNodeError()

  return node.$value
}

/**
 * Recursively unwraps a proxied value.

 * @param value value to unwrap.
 * @returns the unwrapped value.
 */
export function recursivelyUnwrap<T extends object>(value: unknown): T {
  if (!isNode(value)) {
    return value as T
  }

  const unwrapped = unwrap(value) as T
  return recursivelyUnwrap(unwrapped)
}

/**
 * Checks if a given prop is a getter in the given target's prototype chain.
 *
 * @param target an object to check the prototype chain for a given prop.
 * @param prop the prop to check for.
 * @returns true if the prop is a getter in the prototype chain, false otherwise.
 */
export function isGetter(target: object, prop: string) {
  if (!target) {
    return false
  }

  const descriptor = Object.getOwnPropertyDescriptor(target, prop)

  if (descriptor && descriptor.get !== undefined) {
    return true
  }

  return isGetter(Object.getPrototypeOf(target), prop)
}

export function parentOf(node: Node) {
  const nodePath = pathFor(node)

  if (nodePath.isRoot()) {
    return null
  }

  const parentSeed = nodePath.seeds.at(-2) || Seed.from(node.$tree.state)
  return node.$tree.getNodeFor(parentSeed)
}
