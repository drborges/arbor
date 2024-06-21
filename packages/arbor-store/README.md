# Arbor Store

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

A fully typed reactive state management library with very little boilerplate.

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
  count: 0,
})
```

2. Then subscribe to changes made to the store:

```ts
const unsubscribe = store.subscribe((event) => {
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

Arbor will lazily and recursively proxy every object composing the state of the store, no matter how deep and complex that state is, making every bit of it reactive, that basically means that you can subscribe to changes to any part of the state and react to changes accordingly simply relying on the old regular JS APIs you are already used to, such as assignments, or APIs like `Array#push` and `Array#splice`.

## Scoped Stores

Arbor implements a [path tracking](docs/PathTracking.md) mechanism that allows apps to have scoped references of a store, ultimatelly enabling different parts of an app to only react to state changes affecting the scope they are subscribed to.

> [!IMPORTANT]
> This is what's behind optimal re-rendering behavior of the [React binding](../arbor-react/README.md), enabling Arbor to only re-render components that trully depend on the parts of the state being updated.

Let's take the previous counter example and extend it so we can track two different counters:

```ts
const store = new Arbor({
  counter1: {
    count: 0,
  },
  counter2: {
    count: 0,
  },
})
```

We can then create one scope for each counter:

```ts
import { ScopedStore } from "@arborjs/store"

const scope1 = new ScopedStore(store)
const scope2 = new ScopedStore(store)
```

Then subscribe to both scopes so we can see which one reacts to what changes:

```ts
const unsubscribeFromScope1 = scope1.subscribe((event) => {
  console.log("Scope1 counter1:", event.state.counter1.count)
  console.log("Scope1 counter2:", event.state.counter2.count)
})

const unsubscribeFromScope2 = scope2.subscribe((event) => {
  console.log("Scope2 counter1:", event.state.counter1.count)
  console.log("Scope2 counter2:", event.state.counter2.count)
})
```

Each scope will automatically subscribe to state fields as they are accessed. For example, the following will cause `scope1` to automatically subscribe to changes to `counter1.count` but changes to `counter2` will not affect subscribers of `scope1`:

```ts
console.log(scope1.state.counter1.count)
=> 0
```

Now, should we change `counter1.count` from the original `store`, only `scope1` will react to the change since `scope2` has not yet accessed any part of the state, therefore does not depend on any particular part of the state:

```ts
store.state.counter1.count++
=> Scope1 counter1: 1
=> Scope1 counter2: 0
```

Changing `counter2.count` will not notify either of scope since none have accessed that part of the state, meaning they do not depend on it:

```ts
store.state.counter2.count++ // no console logs are executed
```

As soon as we access any part of the state from `scope2` it starts to react to changes to that specific part of the state since it now depends on it:

```ts
console.log(scope2.state.counter1.count)
=> 1
console.log(scope2.state.counter2.count)
=> 0
```

The code above causes `scope2` to subscribe to both `counter1` and `counter2` and react to mutations triggered on either counter:

```ts
store.state.counter1.count++
=> Scope1 counter1: 2
=> Scope1 counter2: 0
=> Scope2 counter1: 2
=> Scope2 counter2: 0
store.state.counter2.count++
=> Scope2 counter1: 2
=> Scope2 counter2: 1
```

Note that mutations to `counter2` only notified `scope2` since `scope1` never accessed `counter1` so it does not depend on that part of the state.

## Subscriptions

The simplest way to subscribe to store changes is from the store itself like in the previous examples, however, you may choose to subscribe to specific [nodes](docs/StateTree.md#nodes) of the [state tree](docs/StateTree.md) directly, keeping your subscriptions focused on a subsset of the application state:

```ts
const store = new Arbor({
  counter1: {
    count: 0,
  },
  counter2: {
    count: 0,
  },
})

store.subscribeTo(store.state.counter1, (event) => {
  // React to changes to `counter1`
})
```

Focusing your subscriptions to specific state tree nodes can be interesting if you have a large number of subscribers that only care about a subset of your application state, making notifications more efficient since not every subscriber needs to be processed.

If you are curious to better understand how this is done internally, check out the details of the [Subscription Tree](docs/StateTree.md#subscription-tree), mechanism used internally by Arbor to achieve this behavior.

## Utility Functions

Arbor also provides a couple utility functions that can be used to simplify certain operations in the [state tree](docs/StateTree.md):

### `detach`

With `detach` you can remove any [node](docs/StateTree.md#nodes) from the state tree without necessarily knowing where the node is held, making it easy to remove for instance items from a list without having a reference to that list.

Here's a simple example inspired by our sample [Todo App](https://codesandbox.io/p/sandbox/base-todo-app-pzgld3):

```ts
import { Arbor, detach, proxiable } from "@arborjs/store"

@proxiable
class Todo {
  constructor(public text: string) {}

  delete() {
    // Arbor will automatically determine which stat tree node is this todo's parent
    // and trigger a mutation that removes the todo from that node.
    detach(this)
  }
}

const store = new Arbor([
  new Todo("Do the dishes"),
  new Todo("Walk the dogs"),
  new Todo("Clean the house"),
])

store.subscribe(event => {
  console.log(`Todo list now has ${event.state.length} items.`)
})

const firstTodo = store.state[0]

// Deleting the todo will cause the subscriber above to run and log the result
firstTodo.delete()
=> Todo list now has 2 items.
```

### `merge`

Can merge an object into a given Arbor [node](docs/StateTree.md#nodes) as a single operation, calling subscribers only once:

```ts
import { Arbor, merge } from "@arborjs/store"

const store = new Arbor([
  {
    id: 1,
    text: "Do the dishes",
    description: "The kitchen could use some love...",
    done: false,
  },
  {
    id: 2,
    text: "Walk the dogs",
    description: "Alice took them out last night, it's time to go out again.",
    done: false,
  },
])

const todo = store.state[0]
const updatedTodo = merge(todo, {
  title: "Do all the dishes",
  description: "The kitchen is a mess right now.",
})
```

### `unwrap`

If you need to access the underlying data wrapped by an Arbor node, you can `unwrap` the node:

```ts
import { Arbor, unwrap } from "@arborjs/store"

const store = new Arbor([
  { id: 1, text: "Do the dishes", done: false },
  { id: 2, text: "Walk the dogs", done: false },
])

const todo = store.state[0]
const unwrappedTodo = unwrap(firstTodo)

// This will not notify subscribers since `unwrappedTodo` is no longer a node of the state tree.
unwrappedTodo.done = true
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
  done = false

  // Detached fields are "detached" from the store's state tree so changing
  // its value will not notify susbcribers.
  @detached priorityChanged = false

  constructor(public content: string, public priority = 0) {}

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
// The following triggers a mutation event in the store and subscribers will be notified
doTheDishesTodo.toggle()
doTheDishesTodo.done
=> true
todoList.length
=> 2
// The following triggers a mutation event in the store and subscribers will be notified
todoList.clear()
todoList.length
=> 0
// The following triggers a mutation event in the store and subscribers will be notified
doTheDishesTodo.priority++
// Because Todo#priorityChanged is @detached, a mutation event is not emitted, so no subscribers are notified.
doTheDishesTodo.priorityChanged = true
```

When building your data model like that, you may need to serialize that data model without losing type information, so when you deserialize that data you get back instances of the correct classes representing each part of your data. For that, check out [@arborjs/json](packages/arbor-json/).

## Learn By Example

We've put together a couple of codesanboxes with examples on how to use Arbor in a React app with code comments further explaining some of the concepts which you may find helpful.

> [!NOTE]
> We'll put together some Vanilla JS examples of Arbor usage soon.

- [Counter App](https://codesandbox.io/p/sandbox/counter-app-yj26xb)
- [Todo App](https://codesandbox.io/p/sandbox/base-todo-app-pzgld3)
- [Payments App](https://codesandbox.io/p/sandbox/payments-app-nvtcrm)

## Support This Project

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## License

Arbor is [MIT licensed](../../LICENSE.md).
