import {
  Serialized,
  SerializedExplicitly,
  Serializer,
  serialize,
  serializeAs,
} from "./index"

class Todo {
  constructor(readonly uuid: string, public text: string) {}

  static $revive({ $value }: SerializedExplicitly<Todo>) {
    return new Todo($value.id, $value.text)
  }

  toJSON() {
    return {
      $reviver: "Todo",
      $value: {
        id: this.uuid,
        text: this.text,
      },
    }
  }
}

@serialize
class DecoratedTodo {
  constructor(readonly uuid: string, public text: string) {}

  static $revive({ $value }: Serialized<DecoratedTodo>) {
    return new DecoratedTodo($value.uuid, $value.text)
  }
}

@serializeAs("MyTodo")
class DecoratedTodoCustomKey {
  constructor(readonly uuid: string, public text: string) {}

  static $revive({ $value }: Serialized<DecoratedTodoCustomKey>) {
    return new DecoratedTodoCustomKey($value.uuid, $value.text)
  }
}

class TodoList extends Map<string, Todo> {
  constructor(...todos: Todo[]) {
    super(todos.map((todo) => [todo.uuid, todo]))
  }

  static $revive({ $value }: SerializedExplicitly<TodoList>) {
    return new TodoList(...$value)
  }

  toJSON() {
    return {
      $reviver: "TodoList",
      $value: Array.from(this.values()),
    }
  }
}

describe("Serializer", () => {
  it("serializes a simple object", () => {
    const serializer = new Serializer()
    const todo = { uuid: "a", text: "Clean the house" }

    const serialized = serializer.stringify(todo)

    expect(serialized).toEqual('{"uuid":"a","text":"Clean the house"}')
  })

  it("deserializes a simple object", () => {
    const serializer = new Serializer()
    const todo = { uuid: "a", text: "Clean the house" }

    const serialized = serializer.stringify(todo)
    const deserialized = serializer.parse(serialized)

    expect(deserialized).toEqual(todo)
  })

  it("serializes a custom type", () => {
    const serializer = new Serializer()
    const todo = new Todo("a", "Clean the house")

    const serialized = serializer.stringify(todo)

    expect(serialized).toEqual(
      '{"$reviver":"Todo","$value":{"id":"a","text":"Clean the house"}}'
    )
  })

  it("deserializes a custom type", () => {
    const serializer = new Serializer()
    serializer.register(Todo)

    const todo = new Todo("a", "Clean the house")

    const serialized = serializer.stringify(todo)
    const deserialized = serializer.parse(serialized)

    expect(deserialized).toBeInstanceOf(Todo)
    expect(deserialized).toEqual(todo)
  })

  it("serializes a custom type decorated with @serializable", () => {
    const serializer = new Serializer()
    serializer.register(DecoratedTodo)

    const todo = new DecoratedTodo("a", "Clean the house")
    const serialized = serializer.stringify(todo)

    expect(serialized).toEqual(
      '{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"DecoratedTodo"}'
    )
  })

  it("serializes a custom type decorated with @serializable and a custom reviver key", () => {
    const serializer = new Serializer()
    serializer.register(DecoratedTodoCustomKey)

    const todo = new DecoratedTodoCustomKey("a", "Clean the house")
    const serialized = serializer.stringify(todo)

    expect(serialized).toEqual(
      '{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"MyTodo"}'
    )
  })

  it("deserializes a custom type decorated with @serializable", () => {
    const serializer = new Serializer()
    serializer.register(DecoratedTodo)

    const todo = new DecoratedTodo("a", "Clean the house")

    const serialized = serializer.stringify(todo)
    const deserialized = serializer.parse(serialized)

    expect(deserialized).toBeInstanceOf(DecoratedTodo)
    expect(deserialized).toEqual(todo)
  })

  it("deserializes a custom type decorated with @serializable and a custom reviver key", () => {
    const serializer = new Serializer()
    serializer.register(DecoratedTodoCustomKey)

    const todo = new DecoratedTodoCustomKey("a", "Clean the house")

    const serialized = serializer.stringify(todo)
    const deserialized = serializer.parse(serialized)

    expect(deserialized).toBeInstanceOf(DecoratedTodoCustomKey)
    expect(deserialized).toEqual(todo)
  })

  it("serializes a nested object made out of custom types", () => {
    const serializer = new Serializer()
    const todoList = new TodoList(
      new Todo("a", "Clean the house"),
      new Todo("b", "Do the dishes"),
      new Todo("c", "Walk the dogs")
    )

    const serialized = serializer.stringify(todoList)

    expect(serialized).toEqual(
      '{"$reviver":"TodoList","$value":[{"$reviver":"Todo","$value":{"id":"a","text":"Clean the house"}},{"$reviver":"Todo","$value":{"id":"b","text":"Do the dishes"}},{"$reviver":"Todo","$value":{"id":"c","text":"Walk the dogs"}}]}'
    )
  })

  it("deserializes a nested object made out of custom types", () => {
    const serializer = new Serializer()
    serializer.register(Todo, TodoList)

    const todoList = new TodoList(
      new Todo("a", "Clean the house"),
      new Todo("b", "Do the dishes"),
      new Todo("c", "Walk the dogs")
    )

    const serialized = serializer.stringify(todoList)
    const deserialized = serializer.parse(serialized)

    expect(deserialized).toBeInstanceOf(TodoList)
    expect(deserialized).toEqual(todoList)
  })
})
