# Arbor

A minimalistic proxy-based state tree library with very little boilerplate.

## Why Arbor?

## Installation

Yarn:

```sh
$ yarn add arbor-store@latest
```

NPM:

```sh
$ npm install arbor-store@latest
```

## Show don't tell

```ts
const store = new Arbor({
  users: [],
})

store.subscribe((nextState, previousState) => {
  console.log("Next state:", nextState)
  console.log("Previous state:", previousState)
})

store.users.push({ name: "John" })
// => Next state: { users: [{ name: "John" }] }
// => Previous state: { users: [] }
store.users[0].name = "John Doe"
// => Next state: { users: [{ name: "John Doe" }] }
// => Previous state: { users: [{ name: "John" }] }
```

## Contributing

## License
