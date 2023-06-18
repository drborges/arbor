# @arborjs/json

Provides a mechanism to easily serialize/deserialize custom user-defined types via an API similar to `JSON.stringify` and `JSON.parse` + some decorator "magic".

## Usage

For most use-cases, the usage is extreamelly simple, with very little boilerplate, one needs to:

1. Create an instance of the `Json` class;
2. Decorate their classes marking them as serializable by the instance of Json;
3. Leverage the `Json#stringify` to serialize your object;
4. And `Json#parse` to deserialize the string data back into an instance of your serialized type.

### Simple use case

1. Instantiate the `Json` class:

```ts
import { Json } from `@arborjs/json`

// NOTE: we'll be referencing this variable in the following snippets
const json = new Json()
```

2. Decorate your class so it can be known by the `Json` instance:

```ts
@json.serialize
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
@json.serialize
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
@json.serializeAs("UserSettings")
class Settings {
  constructor(
    readonly uuid: string,
    readonly userId: string,
    public active: boolean
  ) {}
}

// models/projects/Settings.ts
@json.serializeAs("ProjectSettings")
class Settings {
  constructor(
    readonly uuid: string,
    readonly projectId: string,
    public status: ProjectStatus
  ) {}
}
```

The `serializeAs` decorator instructs `@arborjs/json` to use the provided key to identify the decorated type so that it can differentiate different types with the same name in its registry, ultimatelly allowing proper serialization/deserialization of these types:

```ts
const userSettings = new UserSettings("user-settings-uuid", "user-id", true)
const projectSettings = new ProjectSettings("project-settings-uuid", "project-id", "in progress")

const serializedUserSettings = json.stringify(userSettings)
=> '{"$value":{"uuid":"user-settings-uuid","userId":"user-id","active":true},"$type":"UserSettings"}'

const serializedProjectSettings = json.stringify(projectSettings)
=> '{"$value":{"uuid":"project-settings-uuid","projectId":"project-id","status":"in progress"},"$type":"ProjectSettings"}'
```

### Reducing boilerplate

Here's one recommended/opinionated way to organize your code:

1. Create a `json.ts` file to hide the serialization setup code;
2. Expose only the important bits to your App so it does not have to deal with boilerplate.

Example:

Let's say you create `src/json.ts` to hide the serialization setup logic:

```ts
import { Json } from "@arborjs/json"

const json = new Json()
const serialize = json.serialize
const parse = json.parse.bind(json)
const stringify = json.stringify.bind(json)

export { serialize, stringify, parse }
```

You'd be able to import just the decorator you need in your `src/Todo.ts` implementing the `Todo` abstraction:

```ts
import { serialize } from "./json"

@serialize
class Todo {
  constructor(readonly uuid: string, public text: string) {}
}
```

And the serialization/deserialization methods where you need them:

```ts
import { stringify, parse } from "./json"

const todo = new Todo("my-uuid", "Clean the house")

const serialized = stringify(todo)
=> '{"$value":{"uuid":"my-uuid","text":"Clean the house"},"$type":"Todo"}'

const deserialized = parse(serialized)
expect(deserialized).toEqual(todo)
=> true
```

## License

All packages in this monorepo ar [MIT licensed](../../LICENSE.md).
