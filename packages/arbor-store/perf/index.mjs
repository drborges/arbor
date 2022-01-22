import { prettyPringMeasurements } from "./helpers.mjs"
import { checkMemoryAllocationWhenProduceNextStateViaArbor } from "./memory.perf.mjs"
import {
  produceNextStateViaArbor,
  produceNextStateViaArborProducer,
  produceNextStateViaImmerProducer,
  produceNextStateViaManualReducer,
} from "./mutations.perf.mjs"

import {
  readingLeafNodeFromArborStateTree,
  readingLeafNodeFromPlainObjectStateTree,
} from "./traversing.perf.mjs"

readingLeafNodeFromArborStateTree()
readingLeafNodeFromPlainObjectStateTree()

produceNextStateViaArbor()
produceNextStateViaArborProducer()
produceNextStateViaImmerProducer()
produceNextStateViaManualReducer()

prettyPringMeasurements(performance.getEntriesByType("measure"))

checkMemoryAllocationWhenProduceNextStateViaArbor()
