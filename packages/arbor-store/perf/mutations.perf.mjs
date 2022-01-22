import * as Immer from "immer"
import { performance } from "perf_hooks"

import Arbor, { produce as arborProduce } from "../dist/index.mjs"
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
  const node = readRecursevly(store.root)

  performance.mark("start")
  node.newProp = "mutating leaf node..."
  performance.mark("finish")
  performance.measure(
    `Producing next state tree via Arbor mutation (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}

export function produceNextStateViaArborProducer() {
  global.gc()
  const state = createDeeplyNestedState()

  performance.mark("start")
  arborProduce(state, (root) => {
    const target = reduceRecursevly(root)
    target.newProp = "mutating leaf node..."
  })
  performance.mark("finish")
  performance.measure(
    `Producing next state tree via Arbor producer (depth = ${defaultDepth})`,
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
    `Producing next state tree via Immer producer (depth = ${defaultDepth})`,
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
    `Producing next state tree via plain reducer (depth = ${defaultDepth})`,
    "start",
    "finish"
  )
}
