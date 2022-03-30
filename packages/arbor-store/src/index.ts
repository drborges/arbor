import Path from "./Path"
import clone from "./clone"
import stitch from "./stitch"
import isNode from "./isNode"
import produce from "./produce"
import { Mutation } from "./mutate"
import ArborNode from "./ArborNode"
import Collection from "./Collection"
import proxiable, { ArborProxy } from "./proxiable"
import isClonable, { Clonable } from "./isClonable"
import Arbor, {
  Node,
  MutationMode,
  ArborConfig,
  AttributesOf,
  Plugin,
} from "./Arbor"

import { Subscriber, Unsubscribe } from "./PubSub"

export type {
  Node,
  Clonable,
  ArborConfig,
  Mutation,
  Unsubscribe,
  Subscriber,
  AttributesOf,
  Plugin,
}

export {
  clone,
  isClonable,
  proxiable,
  Collection,
  ArborNode,
  ArborProxy,
  Path,
  produce,
  MutationMode,
  isNode,
  stitch,
  Arbor as default,
}
