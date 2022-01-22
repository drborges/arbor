import { performance } from "perf_hooks"

import Arbor from "../dist/index.mjs"
import {
  createDeeplyNestedState,
  readRecursevly,
  reduceRecursevly,
} from "./helpers.mjs"

export function produceNextStateViaArbor() {
  const state = createDeeplyNestedState()
  const store = new Arbor(state)
  const node = readRecursevly(store.root)

  performance.mark("start")
  node.newProp = "mutating leaf node..."
  performance.mark("finish")
  performance.measure(
    "Producing next state via Arbor mutation",
    "start",
    "finish"
  )
}

export function produceNextStateViaManualReducer() {
  const state = createDeeplyNestedState()

  performance.mark("start")
  reduceRecursevly(state)
  performance.mark("finish")
  performance.measure(
    "Producing next state via plain reducer",
    "start",
    "finish"
  )
}
