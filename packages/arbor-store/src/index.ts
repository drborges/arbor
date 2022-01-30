import Path from "./Path"
import clone from "./clone"
import stitch from "./stitch"
import isNode from "./isNode"
import produce from "./produce"
import proxiable from "./proxiable"
import { Mutation } from "./mutate"
import ArborNode from "./ArborNode"
import Collection from "./Collection"
import isClonable, { Clonable } from "./isClonable"
import Arbor, {
  Node,
  MutationMode,
  ArborConfig,
  Unsubscribe,
  Subscription,
  AttributesOf,
  Plugin,
} from "./Arbor"

export type {
  Node,
  Clonable,
  ArborConfig,
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
  ArborNode,
  Path,
  produce,
  MutationMode,
  isNode,
  stitch,
  Arbor as default,
}
