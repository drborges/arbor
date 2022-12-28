# Arbor

[<img src="https://pics.paypal.com/00/s/MzUxMWFiZWUtMzU3Zi00MzgxLTg2YmUtNjRhM2U1YWUwMDg0/file.PNG" width="7%" />](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=E7PXJC6WW6M4S)

A fully typed, minimalistic proxy-based state tree library with very little boilerplate for React apps.

## Why Arbor?

Arbor is not just another state management library for React apps, it focuses on developer experience and productivity. It does so by providing a very minimal API, with very little boilerplate, for the most part, you'll be working with plain Javascript objects and arrays (thanks to [ES6 Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)) without having to worry about structural sharing, immutability, setting up context providers in order to share state across components, while getting optimal re-render management out-of-the-box.

Here's a simple Counter example:

```ts
import Arbor, { useArbor } from "@arborjs/react"

// Create a store to hold the counter state
const store = new Arbor({
  count: 0,
})

function Counter() {
  // Connect the Counter component to the store
  const counter = useArbor(store)

  // Mutate the state using plain Javascript APIs
  return (
    <>
      <button onClick={() => counter.count++} value="Increment" />
      <button onClick={() => counter.count--} value="Decrement" />
    </>
  )
}

function Echo() {
  // Easily share state across components, no need for context providers!
  const counter = useArbor(store)

  return <h1>Count: {counter.count}</h1>
}

function MyApp() {
  return (
    <div>
      <Echo />
      <Counter />
    </div>
  )
}
```

Arbor optimally keeps track of accesses to the state object using a [Persistent Data Structure](https://en.wikipedia.org/wiki/Persistent_data_structure) ensuring that by default all mutations triggered don't affect the current state object but instead, generate a new one via a process called Structural Sharing. This allows React to optimally compute re-renders out-of-the-box while giving developers the feeling of working with plain JavaScript APIs.

Sounds promising? Check out the documentation below for more in-depth insights and since there's really very minimal boilerplate you might as well [check out a few more examples]().

## Documentation

- [Getting Started](): TODO
- [Examples](): TODO
- [Plugins](): TODO
- [How Does It Do It?](): TODO

Help us improve our docs, PRs are very welcome!

## Support This Project

[<img src="https://pics.paypal.com/00/s/MzUxMWFiZWUtMzU3Zi00MzgxLTg2YmUtNjRhM2U1YWUwMDg0/file.PNG" width="8%" />](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=E7PXJC6WW6M4S)
## License

Arbor is [MIT licensed](./LICENSE).
