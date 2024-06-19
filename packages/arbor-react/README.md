# Arbor React Adapter

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

Official React adapter for [@arborjs/store](../../arbor-store).

## Installation

Via [npm](https://www.npmjs.com/get-npm)

```sh
npm install @arborjs/react
```

Or via [yarn](https://classic.yarnpkg.com/en/docs/install)

```sh
yarn add @arborjs/react
```

## Usage

Similar to how you'd do in a [Vanilla JS app](../../README.md#usage), using Arbor in a React app can be done in 3 simple steps:

Take the following React app as an example:

```tsx
export default function App() {
  return (
    <div>
      <Counter />
      <Actions />
    </div>
  )
}
```

1. Create your Arbor store:

```tsx
import { Arbor, useArbor } from "@arborjs/react"

const store = new Arbor({
  count: 0,
})
```

1. Use the `useArbor` hook to connect React components to the store:

```tsx
function Counter() {
  // This component will automatically re-render when the couter's count value changes
  const counter = useArbor(store)

  return <h1>Count: {counter.count}</h1>
}
```

3. Mutate the store state using plain JS APIs:

> [!NOTE]
> We don't need to `useArbor` here because this component does not need to re-render when the store changes

```tsx
function Actions() {
  return (
    <div>
      <button onClick={() => store.state.count--} value="Decrement">
        -1
      </button>
      <button onClick={() => store.state.count++} value="Increment">
        +1
      </button>
    </div>
  )
}
```

Stores can be as complex as you may need them to be, holding arrays, complex objects, or use [classes to build](../../README.md#arbor-%EF%B8%8F-oop) a more complex data model for your application.

## Optimal Re-Renders

Arbor implements a path tracking mechanism that allows for [scoped store references](../../README.md#scoped-stores). This is what powers the `useArbor` hook, enabling Arbor to determine exactly which React components must re-render when a specific part of the state is changed, avoiding unnecessary re-render by defaulf.

Also, Arbor ensures that object and method references are stable, e.g. their memory reference is kept the same across re-renders unless the object changes, this means you can safely pass store objects via prop or use their methods as event handlers to components memoized with React's [memo](https://react.dev/reference/react/memo) to prevent unnecessary re-render of component subtrees.

## Learn By Example

We've put together a couple of codesanboxes with examples on how to use Arbor in a React app with code comments further explaining some of the concepts which you may find helpful.

- [Counter App](https://codesandbox.io/p/sandbox/counter-app-yj26xb)
- [Todo App](https://codesandbox.io/p/sandbox/base-todo-app-pzgld3)
- [Payments App](https://codesandbox.io/p/sandbox/payments-app-nvtcrm)

## Support This Project

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## License

Arbor is [MIT licensed](../../LICENSE.md).
