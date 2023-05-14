import { performance } from "perf_hooks"

import pkg from "@arborjs/store"
import {
  createDeeplyNestedState,
  defaultDepth,
  readRecursevly,
} from "./helpers.mjs"
const { Arbor } = pkg

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
