import React from "react"
import Arbor from "@arborjs/store"
import useArbor from "@arborjs/react"

const store = new Arbor({
  count: 0,
})

export default function Counter() {
  const counter = useArbor(store)

  return (
    <div>
      <button onClick={() => counter.count--}>Decrement</button>
      <span>{counter.count}</span>
      <button onClick={() => counter.count++}>Increment</button>
    </div>
  )
}
