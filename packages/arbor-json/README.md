# @arborjs/json

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

Type-preserving serialization/deserialization for user-defined types via an API similar to `JSON.stringify` and `JSON.parse` + some decorator "magic".

## Installation

**npm**

```sh
npm install @arborjs/json
```

**yarn**

```sh
yarn add @arborjs/json
```

## Usage

For most use cases, the usage is extremely simple, with very little boilerplate:

1. Decorate your class with the `serializable` decorator;
2. Use the `stringify` function to serialize instances of the decorated class;
3. Use the `parse` function to deserialize data strings representing instances of the decorated class.

```ts
import { serializable, stringify, parse } from "@arborjs/json"

@serializable
class Todo {
  constructor(readonly uuid: string, public text: string) {}
}

const todo = new Todo("my-uuid", "Clean the house")

const serialized = stringify(todo)
=> '{"$value":{"uuid":"my-uuid","text":"Clean the house"},"$type":"Todo"}'

const deserialized = parse(serialized)
expect(deserialized).toEqual(todo)
expect(deserialized).toBeInstanceOf(Todo)
=> true
```

### Managing multiple serializers

In case you need to manage multiple instances of the `Json` serializer in your app, you can:

1. Create an instance of the `Json` class;
2. Decorate your classes with the decorators provided by the `Json` instance;
3. Leverage the `Json#stringify` to serialize your object;
4. And `Json#parse` to deserialize the string data back into an instance of your serialized type.

Example:

1. Instantiate the `Json` class:

```ts
import { Json } from `@arborjs/json`

// NOTE: we'll be referencing this variable in the following snippets
const json = new Json()
```

2. Decorate your class so it can be known by the `Json` instance:

```ts
@json.serializable
class Todo {
  constructor(readonly uuid: string, public text: string) {}
}
```

3. Serialize the object:

```ts
const todo = new Todo("my-uuid", "Clean the house")

const serialized = json.stringify(todo)
=> '{"$value":{"uuid":"my-uuid","text":"Clean the house"},"$type":"Todo"}'
```

4. Deserialize the string data back into an instance of the Todo class:

```ts
const deserialized = json.parse(serialized)

expect(deserialized).toEqual(todo)
=> true
```

### Custom serialization/deserialization logic

In certain situations, you will want to provide your own serialization/deserialization logic, here's how to achieve that:

```ts
@json.serializable
class TodoList extends Map<string, Todo> {
  constructor(...todos: Todo[]) {
    super(todos.map((todo) => [todo.uuid, todo]))
  }

  /*
   * Provide your own deserialization logic
   */
  static fromJSON(value: SerializedBy<TodoList>) {
    return new TodoList(...value)
  }

  /*
   * Provide your own serialization logic
   */
  toJSON() {
    return Array.from(this.values())
  }
}
```

### Handling type name clashes

In case you end up with different types sharing the same name in your application, you can tell `@arborjs/json` which serialization keys to use to identify each type:

```ts
// models/users/Settings.ts
@json.serializableAs("UserSettings")
class Settings {
  constructor(
    readonly uuid: string,
    readonly userId: string,
    public active: boolean
  ) {}
}

// models/projects/Settings.ts
@json.serializableAs("ProjectSettings")
class Settings {
  constructor(
    readonly uuid: string,
    readonly projectId: string,
    public status: ProjectStatus
  ) {}
}
```

The `serializableAs` decorator instructs `@arborjs/json` to use the provided key to identify the decorated type so that it can differentiate different types with the same name in its registry, ultimatelly allowing proper serialization/deserialization of these types:

```ts
const userSettings = new UserSettings("user-settings-uuid", "user-id", true)
const projectSettings = new ProjectSettings("project-settings-uuid", "project-id", "in progress")

const serializedUserSettings = json.stringify(userSettings)
=> '{"$value":{"uuid":"user-settings-uuid","userId":"user-id","active":true},"$type":"UserSettings"}'

const serializedProjectSettings = json.stringify(projectSettings)
=> '{"$value":{"uuid":"project-settings-uuid","projectId":"project-id","status":"in progress"},"$type":"ProjectSettings"}'
```

### Reducing boilerplate

You may choose to move the `Json` serializer setup into different modules to make its usage a little more friendly and with less boilerplate to the final user:

```ts
// src/json1.ts
import { Json } from "@arborjs/json"

const json = new Json()
export const parse = json.parse.bind(json)
export const stringify = json.stringify.bind(json)
export const serializable = json.serializable.bind(json)
export const serializableAs = json.serializableAs.bind(json)

// src/json2.ts
import { Json } from "@arborjs/json"

const json = new Json()
export const parse = json.parse.bind(json)
export const stringify = json.stringify.bind(json)
export const serializable = json.serializable.bind(json)
export const serializableAs = json.serializableAs.bind(json)
```

## License

All packages in this monorepo are [MIT licensed](../../LICENSE.md).
