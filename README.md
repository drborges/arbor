# Arbor

[<img src="https://pics.paypal.com/00/s/MzUxMWFiZWUtMzU3Zi00MzgxLTg2YmUtNjRhM2U1YWUwMDg0/file.PNG" width="12%" />](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=E7PXJC6WW6M4S)

A fully typed, minimalistic proxy-based state tree library with very little boilerplate.

## Why Arbor?

Arbor is not just another state management library, it focuses on developer experience and productivity. It does so by providing a very minimal API, with very little boilerplate, for the most part, you'll be working with plain Javascript objects and arrays (thanks to [ES6 Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)). Arbor itself is framework-aganostic but comes with a React binding that will allow you to easily manage complex application state as if it were nothing, not having to worry about structural sharing, immutability, setting up context providers in order to share state across components, while getting optimal re-render management out-of-the-box.

Here's a simple Counter example:

[![Edit counter-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/counter-example-yj26xb?fontsize=14&hidenavigation=1&module=%2Fsrc%2FApp.tsx&theme=dark)

```tsx
import Arbor from "@arborjs/store";
import useArbor from "@arborjs/react";

/*
 * Create a store to hold the counter state
 */
const store = new Arbor({
  count: 0
});

/*
 * Component encapsulating the action buttons used to increment or decrement the counter
 */
function Actions() {
  // Connect the component to the store. Connected components will re-render whenever the store state changes
  const counter = useArbor(store);

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
  );
}

/*
 * Component encapsulating the counter display
 */
function Counter() {
  // Easily share state across components, no need for context providers!
  const counter = useArbor(store);

  return <h1>Count: {counter.count}</h1>;
}

export default function App() {
  return (
    <div>
      <Counter />
      <Actions />
    </div>
  );
}
```

Arbor optimally keeps track of accesses to nodes within the state tree via a proxying mechanism while creating a [Persistent Data Structure](https://en.wikipedia.org/wiki/Persistent_data_structure) that ensures mutations triggered to the state tree creates a new state snapshot via Structural Sharing. This allows libraries such as React to optimally compute re-renders out-of-the-box while giving developers the feeling of working with plain JavaScript APIs. Arbor also supports a simple plugin architecture (**experimental**) that allows extending the state stores with extra functionality such as persistency, logging, etc...

Sounds promising? Check out the documentation below for more in-depth insights and since there's really very minimal boilerplate you might as well [check out a few more examples](https://github.com/drborges/arbor/tree/main/examples).

## Documentation

- [Getting Started](): TODO
- [Examples](): TODO
- [Plugins](): TODO
- [How Does It Do It?](): TODO

Help us improve our docs, PRs are very welcome!

## Support This Project

[<img src="https://pics.paypal.com/00/s/MzUxMWFiZWUtMzU3Zi00MzgxLTg2YmUtNjRhM2U1YWUwMDg0/file.PNG" width="15%" />](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=E7PXJC6WW6M4S)
## License

Arbor is [MIT licensed](./LICENSE).
