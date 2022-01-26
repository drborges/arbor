import Path from "./Path"
import stitch from "./stitch"
import isNode from "./isNode"
import produce from "./produce"
import { Mutation } from "./mutate"
import ArborNode from "./ArborNode"
import Collection from "./Collection"
import { clone, clonable } from "./cloning"
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
  ArborConfig,
  Mutation,
  Unsubscribe,
  Subscription,
  AttributesOf,
  Plugin,
}

export {
  clone,
  clonable,
  Collection,
  ArborNode,
  Path,
  produce,
  MutationMode,
  isNode,
  stitch,
  Arbor as default,
}
