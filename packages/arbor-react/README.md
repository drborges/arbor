# Arbor React Binding

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

Official React binding for [@arborjs/store](../arbor-store/README.md).

## Installation

Via [npm](https://www.npmjs.com/get-npm)

```sh
npm install @arborjs/react
```

Or via [yarn](https://classic.yarnpkg.com/en/docs/install)

```sh
yarn add @arborjs/react
```

Make sure you have `@arborjs/store` [installed](../arbor-store/README.md#installation).

## Usage

Similar to how you'd do in a [Vanilla JS app](../README.md#usage), using Arbor in a React app can be done in 3 simple steps.

> ![NOTE]
> Make sure you take a look at the documentation for [@arborjs/store](../README.md#usage) before using this biding. Take a moment to also get familiar with some of the [caveats](../arbor-store/docs/Caveats.md) of working with Arbor.

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
> We don't need to `useArbor` here because this component does not need to re-render when the store changes.

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

Arbor implements a path tracking mechanism that allows for [scoped store references](../arbor-store/README.md#scoped-stores). This is what powers the `useArbor` hook, enabling Arbor to determine exactly which React components must re-render when a specific part of the state is changed, avoiding unnecessary re-render by defaulf.

Also, Arbor ensures that object and method references are stable, e.g. their memory reference is kept the same across re-renders unless the object changes, this means you can safely pass store objects via prop or use their methods as event handlers to components memoized with React's [memo](https://react.dev/reference/react/memo) to prevent unnecessary re-render of component subtrees.

## useArbor vs useState

You may choose to use `useArbor` instead of `useState` to manage component's local state and leverage Arbor's reactive API to remove boilerplate and let you focus on application logic.

```tsx
// Application state held in an Arbor store
const store = new Arbor(new TodosApp())

function NewTodoForm() {
  // Use Arbor to manage the component's local state
  const form = useArbor({
    input: {
      value: "",
      onChange(e: ChangeEvent<HTMLInputElement>) {
        this.value = e.target.value
      },
    },
    onSubmit(e: FormEvent) {
      // Merge the local state back into the application store
      store.state.todos.push(new Todo(this.input.value))
      this.input.value = ""
    },
  })

  return (
    <form onSubmit={form.onSubmit}>
      <input {...form.input} />
      <button>Add</button>
    </form>
  )
}
```

By using Arbor to manage your component's local state, you can make that local state reactive, while being able to leverage all the simplicity of using JS standard constructs to interact with the state such as regular assignaments, or other mutable APIs like `Array#push`.

## Detached Fields vs useRef

Sometimes, it's useful to track values across component re-renders without triggering more re-renders as you change that value. Normally in React, you'd resort to `useRef` for that purpose.

Arbor allows you to decorate class fields with `@detached` to inform the store that the value should be detached from its [state tree](../arbor-store/docs/StateTree.md). This makes detached values non-reactive, e.g. changes to them will not trigger subscription notifications, in the context of React that translates to components not reacting to these changes, thus no re-rendering.

Imagine a hypothetical todos app where we need to track whether the priority of a todo has been changed for analytics purposes but that information does not have to be displayed anywhere on the UI, we can achieve that using `@detached` on the `Todo` type itself:

```tsx
import { detached, proxiable } from "@arborjs/store"

@proxiable
class Todo {
  ...
  // Detached fields are "detached" from the store's state tree so changing
  // its value will not notify susbcribers.
  @detached priorityChanged = false
  ...
}
```

Changes to `Todo#priorityChanged` will not trigger mutation events in the store, preventing any components from re-rendering.

## Learn By Example

We've put together a couple of codesanboxes with examples on how to use Arbor in a React app with code comments further explaining some of the concepts which you may find helpful.

- [Counter App](https://codesandbox.io/p/sandbox/counter-app-yj26xb)
- [Todo App](https://codesandbox.io/p/sandbox/base-todo-app-pzgld3)
- [Payments App](https://codesandbox.io/p/sandbox/payments-app-nvtcrm)

## Support This Project

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## License

Arbor is [MIT licensed](../../LICENSE.md).
