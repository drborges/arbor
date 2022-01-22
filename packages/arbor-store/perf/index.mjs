import { prettyPringMeasurements } from "./helpers.mjs"
import { checkMemoryAllocationWhenProduceNextStateViaArbor } from "./memory.perf.mjs"
import {
  produceNextStateViaArbor,
  produceNextStateViaManualReducer,
} from "./mutations.perf.mjs"

import {
  readingLeafNodeFromArborStateTree,
  readingLeafNodeFromPlainObjectStateTree,
} from "./traversing.perf.mjs"

readingLeafNodeFromArborStateTree()
readingLeafNodeFromPlainObjectStateTree()

produceNextStateViaArbor()
produceNextStateViaManualReducer()

prettyPringMeasurements(performance.getEntriesByType("measure"))

checkMemoryAllocationWhenProduceNextStateViaArbor()
