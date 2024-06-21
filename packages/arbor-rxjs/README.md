# Arbor RXJS Binding

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

[RXJS](https://rxjs.dev/) binding for [@arborjs/store](../arbor-store/README.md).

> ![WARNINIG]
> This is currently an **experimental** project, use it at your own risk in production.

## Installation

Via [npm](https://www.npmjs.com/get-npm)

```sh
npm install @arborjs/rxjs
```

Or via [yarn](https://classic.yarnpkg.com/en/docs/install)

```sh
yarn add @arborjs/rxjs
```

Make sure you have `@arborjs/store` [installed](../arbor-store/README.md#installation).

## Usage

```ts
import { Arbor } from "@arborjs/store"
import { from } from "@arborjs/rxjs"
import { filter } from "rxjs/operators"

const store = new Arbor({
  count: 0
})

// 1. Create an Observable version of the store
const observable = from(store)

// 2. Use RXJS APIs to process a stream of mutation events triggered by the store
observable
  .pipe(filter((event) => event.state.count % 2 === 0))
  .forEach((event) => {
    console.log("Even count:", event.state.count)
  })
  .catch(console.error)

store.state.count++
store.state.count++
=> Even count: 2
store.state.count++
store.state.count++
=> Even count: 4
```
