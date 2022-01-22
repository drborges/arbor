const defaultDepth = 10000

export const createDeeplyNestedState = (depth = defaultDepth, state = {}) => {
  const level = `level${depth}`

  if (depth === 0) {
    return state
  }

  state[level] = {}
  return createDeeplyNestedState(--depth, state[level])
}

export const readRecursevly = (state, depth = defaultDepth) => {
  const level = `level${depth}`
  const obj = state[level]

  if (obj == null) {
    return state
  }

  return readRecursevly(obj, --depth)
}

export const reduceRecursevly = (state, depth = defaultDepth) => {
  const nextState = { ...state }

  if (depth === 0) {
    nextState.newProp = "mutating leaf node..."
    return nextState
  }

  return reduceRecursevly(nextState, --depth)
}

export const prettyPringMeasurements = (measurements) => {
  measurements.forEach((measurement) => {
    console.log(`${measurement.name}\n  Duration:`, measurement.duration, "ms")
  })
}
