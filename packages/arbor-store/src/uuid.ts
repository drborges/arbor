/**
 * Represents a unique identifier used to track values within Arbor's state tree.
 *
 * Every node's value gets "stamped" with an non enumerable UUID property that
 * carries over to their new values upon every mutation. This allows Arbor to
 * track values across different state snapshots, enabling to determine when
 * a node is remove from the state tree or moves into a different path rendering
 * them stale, at which point mutations on that node reference are simply ignored
 * by Arbor to avoid overriding state with stale values.
 */
class UUID { }
const ArborUUID = Symbol.for("ArborUUID")

export function getUUID(value: object): UUID | undefined {
  return value?.[ArborUUID]
}

export function setUUID<T extends object>(value: T, uuid = new UUID()) {
  if (!(ArborUUID in value)) {
    Object.defineProperty(value, ArborUUID, {
      value: uuid,
      enumerable: false,
      configurable: false,
    })
  }

  return value
}
