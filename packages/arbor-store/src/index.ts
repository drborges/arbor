import Path from "./Path"
import clone from "./clone"
import isNode from "./isNode"
import produce from "./produce"
import { Mutation } from "./mutate"
import BaseNode from "./BaseNode"
import Collection from "./Collection"
import proxiable, { ArborProxy } from "./proxiable"
import isClonable, { Clonable } from "./isClonable"
import Arbor, {
  INode,
  MutationMode,
  ArborConfig,
  ArborNode,
  Unsubscribe,
  Subscription,
  AttributesOf,
  Plugin,
} from "./Arbor"

export type {
  INode,
  Clonable,
  ArborConfig,
  ArborNode,
  Mutation,
  Unsubscribe,
  Subscription,
  AttributesOf,
  Plugin,
}

export {
  clone,
  isClonable,
  proxiable,
  Collection,
  BaseNode,
  ArborProxy,
  Path,
  produce,
  MutationMode,
  isNode,
  Arbor as default,
}
