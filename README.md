# Arbor

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

A fully typed reactive state management library with very little boilerplate.

## Why Arbor?

Arbor is not just another state management library, it focuses on developer experience and productivity by getting out of your way and letting you focus on your application logic.

Here are some of the core concepts driving Arbor's development:

- **Minimal API**: We try to keep the public API as minial as possible so you can get started in a blink of an eye;
- **Built-in Reactivity**: State is observable (thanks to [ES6 Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)), meaning different parts of your application can subscribe to certain parts of your state and react to changes accordingly;
- **Extensible**: We provide a simple plugin system (experimental at the moment) that enables you to extend Arbor's with new functionality such as logging, [persistency](packages/arbor-plugins), or whatever else you may need;
- **No Dependencies**: Arbor is small an has no external dependencies keeping your application footprint under control;
- **Framework Agnostic**: It can be used in vanilla JS apps, or with a framework of your choice;
- **Official React Support**: Even though it's framework agnostic, we provide an [official React Adapter](packages/arbor-react) that makes developing complex state-driven React apps fun again;
- **Powered by TypeScript**: Benefit of a strong type system to help you catch compile-time bugs and other editior features such as powerful intelisense and refactoring tools;

## Installation

Via [npm](https://www.npmjs.com/get-npm)

```sh
npm install @arborjs/store
```

Or via [yarn](https://classic.yarnpkg.com/en/docs/install)

```sh
yarn add @arborjs/store
```

## Usage

There are basically three steps to working with Arbor:

1. Create a `store` object to hold your application state:

```ts
import { Arbor } from "@arborjs/store"

// The store object in this example is our application store holding the state of a counter.
const store = new Arbor({
  count: 0
})
```

2. Then subscribe to changes made to the store:

```ts
const unsubscribe = store.subscribe(event => {
  // Subscribers are provided with information about the change (a.k.a mutation)
  // triggered on the store, such as type of operation (set, delete, push, splice, etc...).
  // This allows for fine grained control over how to react to the state mutation.
 console.log("Count:", event.state.count)
})

// You can call the returned unsubscribe function whenever you want to stop listening to store updates.
unsubscribe()
```

3. Lastly, interact with the store making changes to its state:

```ts
// The store state is a reactive object, Arbor uses proxies to track access to different
// parts of the state and notify the relevant subscribers when a mutation that affect them
// is triggered in the store.
const counter = store.state

// Mutations can then be triggered via regular JavaScript APIs causing subscribers to react.
counter.count++
=> Count: 1
counter.count++
=> Count: 2
counter.count--
=> Count: 1
counter.count = 5
=> Count: 5
```

Check out our official React adapter [@arborjs/react](packages/arbor-react/) to see how you'd leverage this same counter store in a React app.

## Scoped Stores

Arbor implements a [path tracking]() mechanism that allows apps to have scoped references of a store, ultimatelly enabling different parts of an app to only react to state changes affecting the scope they are subscribed to.

> [!IMPORTANT]
> This is what's behind optimal re-rendering behavior of the React adaptor, enabling Arbor to only re-render components that trully depend on the parts of the state being updated.

Let's take the previous counter example and extend it so we can track two different counters:

```ts
const store = new Arbor({
  counter1: {
    count: 0
  },
  counter2: {
    count: 0
  }
})
```

We can then create one scope for each counter:

> [!WARNING]
> `TrackedArbor` will be renamed to `ScopedStore`.

```ts
import { TrackedArbor } from "@arborjs/store"

const scope1 = new TrackedArbor(store)
const scope2 = new TrackedArbor(store)
```

Then subscribe to both scopes so we can see which one reacts to what changes:

```ts
const unsubscribeFromScope1 = scope1.subscribe(event => {
  console.log("Scope1 Count:", event.state.count)
})

const unsubscribeFromScope2 = scope1.subscribe(event => {
  console.log("Scope2 Count:", event.state.count)
})
```

Each scope will automatically subscribe to state fields as they are accessed. For example, the following will cause `scope1` to automatically subscribe to changes to `counter1.count` but changes to `counter2` will not affect subscribers of `scope1`:

```ts
console.log(scope1.state.counter1.count)
=> 0
```

Now, should we change `counter1.count` and `counter2.count` from the original `store`, only `scope1` will react to the change since `scope2` currently is not subscribed to any particular state fields:

```ts
store.state.counter1.count++
=> Scope1 Count: 1
store.state.counter2.count++
```

As soon as we access a state field from `scope2` it starts to react to changes to that specific part of the state:

```ts
console.log(scope2.state.counter1.count)
console.log(scope2.state.counter2.count)
=> 0
```

The code above causes mutations to both counters to notify subscribers of `scope2`:

```ts
store.state.counter1.count++
=> Scope1 Count: 2
=> Scope2 Count: 2
store.state.counter2.count++
=> Scope2 Count: 2
```

## Arbor ❤️ OOP

Arbor will not enforce any particular data model style, you can use literal objects and arrays to represent your data model or go more "functional" style if that's what you prefer. However, Arbor really shines brighter in more complex applications when you start introducing abstractions to represent your data model usually via JS classes.

You can leverage JavaScript built-in constructs like classes to build more complex data models, all you have to do is decorate them with `@proxiable`, which let's Arbor know instances of the decorated class should be reactive.

Here's what the data model for a Todo app could look like in Arbor:

```ts
import { detatch, detached, proxiable } from "@arborjs/store"

/**
 * Represents a todo entry in the application.
 *
 * This class provides an API that encapsulates and manages a specific
 * Todo entry.
 */
@proxiable
class Todo {
  // Detached fields are "detached" from the store's state tree (thus the terminology)
  // meaning, changing its value will not notify susbcribers.
  //
  // This feature is particularly useful in the context of React, where sometimes you
  // need to track some value without causing React components to re-render.
  @detached priorityChangeFrequency = 0

  constructor(
    public content: string,
    public priority: 0,
    public done = false
  ) {}

  toggle() {
    this.done = !this.done
  }

  increasePriority() {
    this.priority++
    this.priorityChangeFrequency++
  }

  decreasePriority() {
    this.priority--
    this.priorityChangeFrequency++
  }

  delete() {
    // Arbor provides this `detach` utility function
    // that makes it easy for you to remove this from the store
    // without necessarily knowing where exactly it is within your state.
    detach(this)
  }
}

/**
 * Represents the Todo list itself, holding all Todo entries created in the application
 *
 * This class extends the JS built-in Array API with handy methods that make it easier
 * to manage the Todo list.
 */
@proxiable
class TodoList extends Array<Todo> {
  get first() {
    return this[0]
  }

  get last() {
    return this[this.length - 1]
  }

  isEmpty() {
    return this.length === 0
  }

  clear() {
    this.splice(0, this.length)
  }
}
```

Then we'd use that data model to initialize our `store`:

```ts
import { Arbor } from "@arborjs/store"

const store = new Arbor(
  new TodoList(
    new Todo("Do the dishes"),
    new Todo("Walk the dogs"),
    ...
  )
)

const todoList = store.state
const doTheDishesTodo = todoList.first

doTheDishesTodo.done
=> false
doTheDishesTodo.toggle()
doTheDishesTodo.done
=> true
todoList.length
=> 2
todoList.clear()
todoList.length
=> 0
```

When building your data model like that, you may need to serialize that data model without losing type information, so when you deserialize that data you get back instances of the correct classes representing each part of your data. For that, check out [@arborjs/json](packages/arbor-json/).

## Documentation

The example above provide a 10000 foot overview of Arbor, if you like what you see, please check our documentation to learn more about advanced use-cases such as leveraging OOP to build your data model, persisting your store state with a plugin, or tips on how to organize your project:

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
