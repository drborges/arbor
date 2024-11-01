# Arbor

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## Bindings

Even though `@arborjs/store` is framework agnostic, you may want to use it alongside another lib / framework, in which case there are two ways to acomplish that:

1. Use plain Arbor stores and handle the integration yourself;
2. Use a binding to hide the integration boilerplate away providing a better DX.

### Plain Arbor Store

There's really no mystery here. If you decide to use plain Arbor stores, it means you are in charge of the integration.

In many cases, this is a fine option since the ingration work is usually not that complex, here's what you would have to do:

1. Create an Arbor store;
2. Subscribe to store updates so you can react to them (this is where most of the integration work takes place).

The [useArbor](../../arbor-react/src/useArbor.ts) hook from our official React binding can provide some insights on how to implement step #2 above, but here's an example:

```ts
const store = new Arbor({
  count: 0,
})
```

With the state store at hand, you can then subscribe to updates so you can react to them:

```ts
const unsubscribe = store.subscribe((event) => {
  // at this point you can perform the actions needed to notify or interact with
  // the library / framework of your choice.
})

// Call the returned function when it's time to stop listening for updates.
unsubscribe()
```

As noted above, most of the integration work usually takes place within a subscription. At that point, you can react to state changes by interacting with the lib you are integrating with.

In the context of React for instance, this is where the component will have its local state updated with a reference of the store's state causing it to re-render, or in versions of React where [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) is available, we connect the store with React using that hook.

### Using a Binding

A binding is essentially a way to hide integration boilerplate while providing developers an API that is familiar in the context of the library they want to integrate with.

Back to the React example, that translates to providing developers with a React hook that connects the React component to the store. The binding then takes care of:

1. Managing the re-render lifecycle of the component by reacting to state changes;
2. Optimize re-rendering by making sure components only re-render when the parts of the state they depend on are changed, avoiding unnecessary re-renders;
3. Automatically unsubscribe from the store when the component unmounts;
4. Allows developers to mutate the store using plain JS constructs such as assignments or APIs like `Array#push` and `Array#splice` while freeing them from having to worry about immutability, copying objects and arrays around as they get changed.

We invite you to explore our official [React binding](../../arbor-react/README.md) as well as our **experimental** [RXJS binding](../../arbor-rxjs/README.md) to get inspired.
