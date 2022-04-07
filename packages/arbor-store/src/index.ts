import Arbor, {
  ArborConfig,
  AttributesOf,
  MutationMode,
  Node,
  Plugin,
} from "./Arbor"

import Path from "./Path"
import stitch from "./stitch"
import isNode from "./isNode"
import produce from "./produce"
import ArborNode from "./ArborNode"
import { Mutation } from "./mutate"
import Collection from "./Collection"
import { Subscriber, Unsubscribe } from "./PubSub"
import proxiable, { ArborProxy } from "./proxiable"

export type {
  Node,
  Plugin,
  Mutation,
  Subscriber,
  ArborConfig,
  Unsubscribe,
  AttributesOf,
}

export {
  Path,
  isNode,
  stitch,
  produce,
  ArborNode,
  proxiable,
  Collection,
  ArborProxy,
  MutationMode,
  Arbor as default,
}
