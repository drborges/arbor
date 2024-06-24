# Arbor Plugins

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

Set of official plugins for [@arborjs/store](../arbor-store/README.md).

> [!WARNING]
> We will most likely split this package and move each plugin into their own package in the future.

## Installation

Via [npm](https://www.npmjs.com/get-npm)

```sh
npm install @arborjs/plugins
```

Or via [yarn](https://classic.yarnpkg.com/en/docs/install)

```sh
yarn add @arborjs/plugins
```

## Usage

### `Logger`

Provides some logging information regarding mutations happening in the store.

> [!WARNING]
> This plugin is experimental and will likely change in the near future.

```ts
import { Arbor } from "@arborjs/store"
import { Logger } from "@arborjs/plugins"

const store = new Arbor({
  count: 0,
})

store.use(new Logger("counter"))
```

### `LocalStorage`

Persists your store data to the browser's local storage, keeping it up-to-date as mutations happen.

```ts
import { Arbor } from "@arborjs/store"
import { LocalStorage } from "@arborjs/plugins"

const store = new Arbor({
  count: 0,
})

store.use(new LocalStorage({ key: "apps.counter" }))
```

You can override the serialization and deserialization logic used to persist data to local storage and read from it. This is quite handy when defining custom types to represent your data model, you can resort to [@arborjs/json](../arbor-json/README.md) to handle type-preserving serialization/deserialization logic:

```ts
import { Arbor } from "@arborjs/store"
import { LocalStorage } from "@arborjs/plugins"
import { stringify, parse } from "@arborjs/json"

import { Todo } from "../models/Todo"
import { TodoList } from "../models/TodoList"

const store = new Arbor(
  new TodoList(new Todo("Do the dishes"), new Todo("Walk the dogs"))
)

store.use(
  new LocalStorage({
    key: "apps.todos",
    deserialize: parse,
    serialize: stringify,
  })
)
```

Using `@arborjs/json` to handle serialization/deserialization means that your application state will be serialized and save into local storage with type information preserved so when deserialized, what you get back are instances of the types composing the state, rather than raw literal objects and arrays.

## Custom Plugins

> [!WARNING]
> The plugin system is currently being experimented with and its API may suffer adjustments in the near future. However, we feel like its public API is close to a stable state.

Implementing a plugin for Arbor stores is quite simple, all you have to do is provide an object that conforms to the [Plugin](https://github.com/drborges/arbor/blob/main/packages/arbor-store/src/types.ts#L66-L68) type:

```ts
type Plugin<T extends object> = {
  configure(store: Store<T>): Promise<Unsubscribe>
}
```

When passing an instance of a plugin to `Arbor#use`, the store will call the plugin's `configure` method, passing itself as an argument and wait on the returned `Promise` to resolve.

The `configure` method is where the plugin performs the logic to connect itself to the store, usually by subscribing to store events and returning a `Promise` that resolves when the configuration process is completed.

The returned promise resolves to a `unsubscribe` function that can be called whenever the plugin needs to disconnect from the store. When the configuration fails, the promise should then be rejected.

## Support This Project

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## License

Arbor is [MIT licensed](./LICENSE.md).
