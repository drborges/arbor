import { ArborNode, INode } from "./Arbor"
import Path from "./Path"
import { ArborError, DetachedNodeError, NotAnArborNodeError } from "./errors"
import { isNode } from "./guards"

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

  if (node.$path.isRoot()) {
    throw new ArborError("Cannot detach store's root node")
  }

  const nodeParentProp = node.$path.props[node.$path.props.length - 1]
  const parentNode = node.$tree.getNodeAt(node.$path.parent)
  delete parentNode[nodeParentProp]

  return node.$unwrap()
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

  node.$tree.mutate(node.$path, (value) => {
    Object.assign(value, data)
    return {
      operation: "merge",
      props: Object.keys(data),
    }
  })

  return node.$tree.getNodeAt(node.$path)
}

/**
 * Determines the node's path within the state tree.
 *
 * @param node the node to determine the path for.
 * @returns the path of the node within the state tree.
 */
export function path<T extends object>(node: ArborNode<T>): Path {
  if (!isNode<T>(node)) {
    throw new NotAnArborNodeError()
  }

  if (isDetached(node)) {
    throw new DetachedNodeError()
  }

  return node.$path
}

/**
 * Checks if node is no longer in the state tree.
 *
 * @param node the node to check whether it's detached from the state tree.
 * @returns true if node is no longer in the state tree, false otherwise.
 */
export function isDetached<T extends object>(node: T): boolean {
  if (!isNode(node)) return true

  const reloadedNode = node.$tree.getNodeAt<INode>(node.$path)

  // Node no longer exists within the state tree
  if (!reloadedNode) return true

  const reloadedValue = reloadedNode.$unwrap()
  const value = node.$unwrap()
  if (value === reloadedValue) return false
  if (global.DEBUG) {
    // eslint-disable-next-line no-console
    console.warn(`Stale node pointing to path ${node.$path.toString()}`)
  }

  return true
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

  return node.$unwrap()
}
