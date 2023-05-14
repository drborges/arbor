import { performance } from "perf_hooks"

import { Arbor } from "../dist/index.mjs"
import {
  createDeeplyNestedState,
  defaultDepth,
  readRecursevly,
} from "./helpers.mjs"

export function readingLeafNodeFromArborStateTree() {
  const state = createDeeplyNestedState()
  const store = new Arbor(state)

  performance.mark("start")
  readRecursevly(store.state)
  performance.mark("finish")
  performance.measure(
    `Reading a leaf node from an Arbor state tree (depth = ${defaultDepth})`,
    "start",
    "finish"
  )

  performance.mark("start")
  readRecursevly(store.state)
  performance.mark("finish")
  performance.measure(
    `Reading a leaf node from a cached Arbor state tree (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}

export function readingLeafNodeFromPlainObjectStateTree() {
  const state = createDeeplyNestedState()

  performance.mark("start")
  readRecursevly(state)
  performance.mark("finish")
  performance.measure(
    `Reading a leaf node from a plain object state tree (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}
