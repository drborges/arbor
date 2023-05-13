/**
 * @deprecated default exports will be removed from Arbor in the next release
 */
export { default } from "./Arbor"
export { default as Arbor, Proxiable } from "./Arbor"
export { default as Path } from "./Path"
export { default as isNode } from "./isNode"
export { default as BaseNode } from "./BaseNode"
export { default as NodeCache } from "./NodeCache"
export { default as Subscribers } from "./Subscribers"
export { default as NodeHandler } from "./NodeHandler"
export { default as NodeArrayHandler } from "./NodeArrayHandler"
export { default as Repository } from "./Repository"
export { default as isProxiable, ArborProxiable } from "./isProxiable"
export { ArborError, NotAnArborNodeError, MissingUUIDError } from "./errors"

export type { Mutation } from "./mutate"
export type { Record } from "./Repository"
export type { MutationEvent, Subscriber, Unsubscribe } from "./Subscribers"
export type {
  ArborConfig,
  ArborNode,
  AttributesOf,
  INode,
  Handler,
  Plugin,
} from "./Arbor"
