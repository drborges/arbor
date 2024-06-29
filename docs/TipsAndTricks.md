# Arbor Tips & Tricks

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## Organizing Your Project

Arbor does not enforce any project structure to use it, however, the following structure has proved quite fitting for our needs and perhaps, it can work for you as well:

```sh
my-app/
├── README.md
├── package.json
├── public/
│   └── index.html
└── src/
    ├── components/
    ├── helpers/
    ├── models/
    ├── selectors/
    └── stores/
```

The more "Arbor-specific" part of the setup are the directories named `models`, `selectors`, and `stores`, where:

1. `components`: Home to your React components;
2. `helpers`: A place for helper functions used across the application;
3. `models`: It's where you can define your data model usually implemented using JS classes, but you can also define constructor functions that return your data types in plain JS objects/arrays if you prefer not to use more traditional OOP;
4. `selectors`: Here you can define "selector" functions used to select something from the store by a given condition or UUID so you can reuse this lookup logic across your application;
5. `stores`: This is where you define your Arbor store or stores if you decide to model your application using multiple ones.

Check out [this sample todo app](https://codesandbox.io/p/sandbox/todo-app-pzgld3?layout=%257B%2522sidebarPanel%2522%253A%2522EXPLORER%2522%252C%2522rootPanelGroup%2522%253A%257B%2522direction%2522%253A%2522horizontal%2522%252C%2522contentType%2522%253A%2522UNKNOWN%2522%252C%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522id%2522%253A%2522ROOT_LAYOUT%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522UNKNOWN%2522%252C%2522direction%2522%253A%2522vertical%2522%252C%2522id%2522%253A%2522clqvg7yjx00063b6kyhn9k6tk%2522%252C%2522sizes%2522%253A%255B100%252C0%255D%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522EDITOR%2522%252C%2522direction%2522%253A%2522horizontal%2522%252C%2522id%2522%253A%2522EDITOR%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL%2522%252C%2522contentType%2522%253A%2522EDITOR%2522%252C%2522id%2522%253A%2522clqvg7yjx00023b6kkkmhgoz2%2522%257D%255D%257D%252C%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522SHELLS%2522%252C%2522direction%2522%253A%2522horizontal%2522%252C%2522id%2522%253A%2522SHELLS%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL%2522%252C%2522contentType%2522%253A%2522SHELLS%2522%252C%2522id%2522%253A%2522clqvg7yjx00033b6kk92jby42%2522%257D%255D%252C%2522sizes%2522%253A%255B100%255D%257D%255D%257D%252C%257B%2522type%2522%253A%2522PANEL_GROUP%2522%252C%2522contentType%2522%253A%2522DEVTOOLS%2522%252C%2522direction%2522%253A%2522vertical%2522%252C%2522id%2522%253A%2522DEVTOOLS%2522%252C%2522panels%2522%253A%255B%257B%2522type%2522%253A%2522PANEL%2522%252C%2522contentType%2522%253A%2522DEVTOOLS%2522%252C%2522id%2522%253A%2522clqvg7yjx00053b6kso66pqq5%2522%257D%255D%252C%2522sizes%2522%253A%255B100%255D%257D%255D%252C%2522sizes%2522%253A%255B60%252C40%255D%257D%252C%2522tabbedPanels%2522%253A%257B%2522clqvg7yjx00023b6kkkmhgoz2%2522%253A%257B%2522tabs%2522%253A%255B%257B%2522id%2522%253A%2522clqvg7yjw00013b6kbmswynyb%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522FILE%2522%252C%2522filepath%2522%253A%2522%252Fsrc%252Findex.tsx%2522%252C%2522state%2522%253A%2522IDLE%2522%257D%252C%257B%2522id%2522%253A%2522clxqa46xd00023b6t1vlkghct%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522FILE%2522%252C%2522initialSelections%2522%253A%255B%257B%2522startLineNumber%2522%253A72%252C%2522endLineNumber%2522%253A72%252C%2522startColumn%2522%253A46%252C%2522endColumn%2522%253A46%257D%255D%252C%2522filepath%2522%253A%2522%252Fsrc%252FApp.tsx%2522%252C%2522state%2522%253A%2522IDLE%2522%257D%255D%252C%2522id%2522%253A%2522clqvg7yjx00023b6kkkmhgoz2%2522%252C%2522activeTabId%2522%253A%2522clxqa46xd00023b6t1vlkghct%2522%257D%252C%2522clqvg7yjx00053b6kso66pqq5%2522%253A%257B%2522tabs%2522%253A%255B%257B%2522id%2522%253A%2522clqvg7yjx00043b6k84xznnvi%2522%252C%2522mode%2522%253A%2522permanent%2522%252C%2522type%2522%253A%2522UNASSIGNED_PORT%2522%252C%2522port%2522%253A0%252C%2522path%2522%253A%2522%252F%2522%257D%255D%252C%2522id%2522%253A%2522clqvg7yjx00053b6kso66pqq5%2522%252C%2522activeTabId%2522%253A%2522clqvg7yjx00043b6k84xznnvi%2522%257D%252C%2522clqvg7yjx00033b6kk92jby42%2522%253A%257B%2522tabs%2522%253A%255B%255D%252C%2522id%2522%253A%2522clqvg7yjx00033b6kk92jby42%2522%257D%257D%252C%2522showDevtools%2522%253Atrue%252C%2522showShells%2522%253Afalse%252C%2522showSidebar%2522%253Atrue%252C%2522sidebarPanelSize%2522%253A15%257D) project in CodeSandbox for more insights.

## Serializing Custom Types

One of Arbor's strengths is the fact you can rely on built-in JS constructs to model your application state, for instance defining custom types in a more OOP way by using classes.

When choosing that path, you may run into a common scenario where serializing custom types you end up losing type information, meaning, deserializing the serialized data will not give you back instances of the types you defined, but rather, literal objects and arrays.

One common solution is for you to create some serialization/deserialization logic that knows how to transform data accordingly. For small datasets that's usually OK, but as your data model becomes more complex, this task gets quite tedious and error-prone. To make this serialization/deserialization work easier, we've built [@arborjs/json](../packages/arbor-json/), check it out and let us know what you think 😁.

## Sharing State Across Apps

You can connect different apps (React or not) through a global Arbor store! You can subscribe to store updates from different apps to react to changes accordingly.

This can be used as an integration mechanism to keep two different apps in sync or aware of common data flows.

## Local State With `useArbor`

In React, you can also use Arbor to manage your component's local state to leverage all the reactivity goodies without necessarily having a global store.

To do that, simply [pass an object](../packages//arbor-react#usearbor-vs-usestate) as the local state initial value to `useArbor` hook and it will return a reactive version of that object back to you. At this point, you can mutate that reactive object using Regular JS constructs and the React component will re-render accordingly.

## Detached fields vs `useRef`

In React apps, sometimes you need to track a certain value without forcing a re-render of your components. For that purpose, we usually resort to the [useRef](https://react.dev/reference/react/useRef) hook.

In Arbor, you can achieve a similar result with `@detached` fields. Detached fields of `@proxiable` classes are not attached to the store's [state tree](../packages/arbor-store/docs/StateTree.md) so you can freely change their value without triggering mutation events, which means React components will not re-render when these fields are updated.

Check out the `@arborjs/react` README for a [usage example](../packages/arbor-react#detached-fields-vs-useref).

## Isolating Re-renders: Part 1

Due to how the [components tree](https://react.dev/learn/understanding-your-ui-as-a-tree#your-ui-as-a-tree) works in React, every time a component re-renders it also re-renders its children. In other words, the entire component's subtree re-renders.

When rendering a subtree happens to be an expensive task you may want to optimize your code so that the subtree only re-renders when absolutely needed. That's where [React.memo](https://react.dev/reference/react/memo) can be helpful. Components wrapped with `React.memo` will only re-render as part of their parent's rendering cycle, if their props have changed.

Arbor ensures objects in the store (a.k.a nodes of the state tree), have their memory reference stable across re-renders, only changing when that object is updated, same is true for methods defined in these objects, which means you can pass them as props to components wrapped with `React.memo` and leverage this optimization. Example:

```tsx
const store = new Arbor([
  { id: 1, text: "Do the dishes", done: false },
  { id: 2, text: "Clean the house", done: true },
])

function TodoList() {
  const todos = useArbor(store)

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={todos.delete(todo)}
        />
      ))}
    </ul>
  )
}

const TodoItem = React.memo(({ todo, onDelete }) => {
  return (
    <li>
      {todo.text}
      <button onClick={onDelete}>Delete</button>
    </li>
  )
})
```

## Isolating Re-renders: Part 2

The previous section shows how to leverage `React.memo` and Arbor's stable object references to prevent unnecessary re-renders of children components when the parent component re-renders. That, however, does not take care of one interesting scenario.

In the todo list example, the `TodoList` component is the one connected to the store and when a `TodoItem` updates, say you change their text, or mark them as done, the `TodoList` will still re-render even though, it did not have to since the state of the list is not tied to the content of a todo or their completeness state.

In this example, an ideal scenario would be for the `TodoList` component to only re-render when a new todo is added to the list or removed, changes to the contents of a todo should not impact how the list is displayed.

To achieve that desired ideal behavior, we can take advantage of Arbor's [path tracking](../packages/arbor-store/docs/PathTracking.md). Every time you connect a React component to the store using `useArbor`, the value returned by that hook is a proxy that can track every part of the state accessed by the React component, in other words, it knows exactly which parts of the store's state the component depends on, and will only re-render the component when those dependencies are updated and nothing else.

Let's take the Todo List example from the previous section and optimize it to leverage Arbor's path tracking to ensure the `TodoList` component does not change when a `TodoItem` updates.

```tsx
const store = new Arbor([
  { id: 1, text: "Do the dishes", done: false },
  { id: 2, text: "Clean the house", done: true },
])

function TodoList() {
  const todos = useArbor(store)

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          id={todo.id}
          onDelete={todos.delete(todo)}
        />
      ))}
    </ul>
  )
}

const TodoItem = React.memo(({ id, onDelete }) => {
  const todo = useArbor(store.state.find(todo => todo.id === id))

  return (
    <li>
      {todo.text}
      <button onClick={onDelete}>Delete</button>
    </li>
  )
})
```

Let's break that code snippet down:

1. We no longer pass `todo` as prop to `TodoItem`;
2. Instead, we pass the `id` of the todo and let the `TodoItem` look up the todo from the store by its id and connect to the store via `useArbor` but specifically, it connects to the node representing that todo.

By doing that, we connect `TodoList` and `TodoItem` to the store but each component is scoped to updates affecting the parts of the state that they depend on.

The `TodoItem` component will re-render every time the `text` or `id` of the todo changes, whereas the `TodoList` will re-render only if the state of the array changes, e.g. a todo is removed or added, or if the `id` of a todo item changes since the component references that field within the map loop.

This optimization can be huge when dealing with large lists where items can be updated while the list does not have to re-render.
