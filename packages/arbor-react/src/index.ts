import Arbor, {
  Path,
  Collection,
  BaseNode,
  produce,
  MutationMode,
} from "@arborjs/store"

import { watchAnyMutations } from "./watchAnyMutations"
import { watchChildrenProps } from "./watchChildrenProps"
import { watchNode } from "./watchNode"
import { watchNodeProps } from "./watchNodeProps"
import { watchPaths } from "./watchPaths"
import useArbor, { Watcher } from "./useArbor"

export type {
  Watcher
}

export {
  Collection,
  useArbor,
  Path,
  produce,
  MutationMode,
  BaseNode,
  Arbor as default,
  watchAnyMutations,
  watchChildrenProps,
  watchNode,
  watchNodeProps,
  watchPaths,
}
