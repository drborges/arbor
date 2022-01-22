import { memoryUsage } from "process"

import Arbor from "../dist/index.mjs"
import { createDeeplyNestedState, readRecursevly } from "./helpers.mjs"

export function checkMemoryAllocationWhenProduceNextStateViaArbor() {
  console.log("\nHeap Allocation")
  global.gc()
  const initial = memoryUsage()
  const state = createDeeplyNestedState()
  const afterRawStateAllocation = memoryUsage()
  console.log(
    "  After raw state allocation",
    (afterRawStateAllocation.heapUsed - initial.heapUsed) / 1000,
    "Kb"
  )

  const store = new Arbor(state)
  const afterArborStoreAllocation = memoryUsage()
  console.log(
    "  After Arbor store allocation",
    (afterArborStoreAllocation.heapUsed - afterRawStateAllocation.heapUsed) /
      1000,
    "Kb"
  )

  const node = readRecursevly(store.root)
  const afterAccessingLeafNode = memoryUsage()
  console.log(
    "  After accessing leaf node",
    (afterAccessingLeafNode.heapUsed - afterArborStoreAllocation.heapUsed) /
      1000,
    "Kb"
  )

  node.newProp = "mutating leaf node..."
  const afterMutatingLeafNode = memoryUsage()
  console.log(
    "  After mutating leaf node",
    (afterMutatingLeafNode.heapUsed - afterAccessingLeafNode.heapUsed) / 1000,
    "Kb"
  )
}
