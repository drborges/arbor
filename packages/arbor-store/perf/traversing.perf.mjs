import { performance } from "perf_hooks"

import Arbor from "../dist/index.esm.js"
import { createDeeplyNestedState, readRecursevly } from "./helpers.mjs"

export function readingLeafNodeFromArborStateTree() {
  const state = createDeeplyNestedState()
  const store = new Arbor(state)

  performance.mark("start")
  readRecursevly(store.root)
  performance.mark("finish")
  performance.measure(
    "Reading a leaf node within a very tall Arbor state tree",
    "start",
    "finish"
  )

  performance.mark("start")
  readRecursevly(store.root)
  performance.mark("finish")
  performance.measure(
    "Reading a leaf node within a very tall but cached Arbor state tree",
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
    "Reading a leaf node within a very tall plain object state tree",
    "start",
    "finish"
  )
}
