import { ArborNode } from "./Arbor"
import { ArborError, DetachedNodeError, NotAnArborNodeError } from "./errors"
import isNode from "./isNode"

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

  if (node.$tree.isDetached(node)) {
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

  if (node.$tree.isDetached(node)) {
    throw new DetachedNodeError()
  }

  node.$tree.mutate(node.$path, (value) => {
    Object.assign(value, data)
    return {
      operation: "merge",
      props: Object.keys(data),
    }
  })

  return node.$tree.getNodeAt(node.$path) as ArborNode<T>
}

/**
 * Determines the node's path within the state tree.
 *
 * @param node the node to determine the path for.
 * @returns the path of the node within the state tree.
 */
export function path<T extends object>(node: ArborNode<T>) {
  if (!isNode<T>(node)) {
    throw new NotAnArborNodeError()
  }

  if (node.$tree.isDetached(node)) {
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
export function isDetached<T extends object>(node: ArborNode<T>): boolean {
  if (!isNode(node)) throw new NotAnArborNodeError()

  return node.$tree.isDetached(node)
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
