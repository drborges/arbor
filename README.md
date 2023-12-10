# Arbor

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

A fully typed reactive state tree library with very little boilerplate.

## Why Arbor?

Arbor is not just another state management library, it focuses on developer experience and productivity. It does so by providing a very minimal API, with very little boilerplate, for the most part, you'll be working with plain Javascript objects, arrays and classes (thanks to [ES6 Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)).

Arbor itself is framework-aganostic but comes with a [React binding]() that will allows managing complex application state without the need to worry about structural sharing, memoization, immutability, prop drilling or managing complex context providers in order to share state across components, while getting optimal re-render out-of-the-box thanks to Arbor's [path tracking]() mechanism which ensures that components only re-render if they are affected by the state updades triggered on the store.

Here's a simple Counter example:

[![Edit counter-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/counter-app-yj26xb?fontsize=14&hidenavigation=1&module=%2Fsrc%2FApp.tsx&theme=dark)

```tsx
import { Arbor } from "@arborjs/store"
import { useArbor } from "@arborjs/react"

/*
 * Create a store to hold the counter state
 */
const store = new Arbor({
  count: 0
})

function Actions() {
  // Connect the component to the store so it can react to updates
  //
  // Connected components will only re-render if the store update
  // affects the part of the state that the component depends on!
  const counter = useArbor(store)

  // Mutate the state using plain Javascript APIs
  return (
    <div>
      <button onClick={() => counter.count--} value="Decrement">
        -1
      </button>
      <button onClick={() => counter.count++} value="Increment">
        +1
      </button>
    </div>
  )
}

function Counter() {
  // Easily share state across components, no need for context providers!
  const counter = useArbor(store)

  return <h1>Count: {counter.count}</h1>
}

export default function App() {
  return (
    <div>
      <Counter />
      <Actions />
    </div>
  )
}
```

Arbor optimally keeps track of accesses to nodes within the state tree via a proxying mechanism while creating a [Persistent Data Structure](https://en.wikipedia.org/wiki/Persistent_data_structure) that ensures mutations triggered to the state tree creates a new state snapshot via Structural Sharing. This allows libraries such as React to optimally compute re-renders out-of-the-box while giving developers the feeling of working with plain JavaScript APIs.

Arbor also supports a simple plugin architecture (**experimental**) that allows extending the state stores with extra functionality such as persistency, logging, etc...

Sounds promising? Check out the documentation below for more in-depth insights!

## Documentation

- Getting Started
  - Introduction
  - Sharing State
  - `useArbor` vs `useState`
  - Custom Types
  - Serializing State
  - Project Structure
  - Caveats
- Learn by Example:
  - [Counter App](https://codesandbox.io/p/sandbox/counter-app-yj26xb)
  - [Todo App](https://codesandbox.io/p/sandbox/base-todo-app-pzgld3)
  - [Payments App](https://codesandbox.io/p/sandbox/payments-app-nvtcrm)
- Plugins:
  - [Logging]()
  - [LocalStorage Persitency]()
  - [Backend Persistency]()

Help us improve our docs, PRs are very welcome!

## Support This Project

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## License

Arbor is [MIT licensed](./LICENSE.md).
