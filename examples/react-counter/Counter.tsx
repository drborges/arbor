import { Arbor } from "@arborjs/store"
import { useArbor } from "@arborjs/react"
import React, { memo } from "react"

import "./styles.css"

export const store = new Arbor({
  count: 0,
})

const DecrementButton = memo(() => {
  const counter = store.state

  return <button onClick={() => counter.count--}>-1</button>
})

const IncrementButton = memo(() => {
  const counter = store.state

  return <button onClick={() => counter.count++}>+1</button>
})

const Counter = memo(() => {
  const counter = useArbor(store)

  return <span>Count: {counter.count}</span>
})

export default function CounterApp() {
  return (
    <div>
      <Counter />
      <DecrementButton />
      <IncrementButton />
    </div>
  )
}
