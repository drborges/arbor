import * as Immer from "immer"
import { performance } from "perf_hooks"

import pkg from "@arborjs/store"
const { Arbor } = pkg
import {
  createDeeplyNestedState,
  defaultDepth,
  readRecursevly,
  reduceRecursevly,
} from "./helpers.mjs"
const immerProduce = Immer.produce

export function produceNextStateViaArbor() {
  global.gc()
  const state = createDeeplyNestedState()
  const store = new Arbor(state)
  const node = readRecursevly(store.state)

  performance.mark("start")
  node.newProp = "mutating leaf node..."
  performance.mark("finish")
  performance.measure(
    `Producing the next state tree via Arbor mutation (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}

export function produceNextStateViaImmerProducer() {
  global.gc()
  const state = createDeeplyNestedState()

  performance.mark("start")
  immerProduce(state, (draft) => {
    const target = reduceRecursevly(draft)
    target.newProp = "mutating leaf node..."
  })
  performance.mark("finish")
  performance.measure(
    `Producing the next state tree via Immer producer (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}

export function produceNextStateViaManualReducer() {
  global.gc()
  const state = createDeeplyNestedState()

  performance.mark("start")
  reduceRecursevly(state)
  performance.mark("finish")
  performance.measure(
    `Producing the next state tree via plain reducer (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}
