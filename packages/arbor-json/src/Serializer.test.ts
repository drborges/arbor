import {
  Json,
  Serialized,
  SerializedExplicitly,
  serialize,
  serializeAs,
} from "./index"

class Todo {
  constructor(readonly uuid: string, public text: string) {}

  static $revive(value: SerializedExplicitly<Todo>) {
    return new Todo(value.id, value.text)
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

class TodoList extends Map<string, Todo> {
  constructor(...todos: Todo[]) {
    super(todos.map((todo) => [todo.uuid, todo]))
  }

  static $revive(value: SerializedExplicitly<TodoList>) {
    return new TodoList(...value)
  }

  toJSON() {
    return {
      $reviver: "TodoList",
      $value: Array.from(this.values()),
    }
  }
}

describe("Serializer", () => {
  describe("simple object", () => {
    it("serializes a simple object", () => {
      const todo = { uuid: "a", text: "Clean the house" }

      const json = new Json()
      const serialized = json.stringify(todo)

      expect(serialized).toEqual('{"uuid":"a","text":"Clean the house"}')
    })

    it("deserializes a simple object", () => {
      const todo = { uuid: "a", text: "Clean the house" }

      const json = new Json()
      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toEqual(todo)
    })
  })

  describe("custom type", () => {
    it("serializes a custom type", () => {
      const todo = new Todo("a", "Clean the house")

      const json = new Json()
      const serialized = json.stringify(todo)

      expect(serialized).toEqual(
        '{"$reviver":"Todo","$value":{"id":"a","text":"Clean the house"}}'
      )
    })

    it("deserializes a custom type", () => {
      const json = new Json()
      json.register(Todo)

      const todo = new Todo("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(Todo)
      expect(deserialized).toEqual(todo)
    })

    it("serializes a nested object made out of custom types", () => {
      const json = new Json()
      const todoList = new TodoList(
        new Todo("a", "Clean the house"),
        new Todo("b", "Do the dishes"),
        new Todo("c", "Walk the dogs")
      )

      const serialized = json.stringify(todoList)

      expect(serialized).toEqual(
        '{"$reviver":"TodoList","$value":[{"$reviver":"Todo","$value":{"id":"a","text":"Clean the house"}},{"$reviver":"Todo","$value":{"id":"b","text":"Do the dishes"}},{"$reviver":"Todo","$value":{"id":"c","text":"Walk the dogs"}}]}'
      )
    })

    it("deserializes a nested object made out of custom types", () => {
      const json = new Json()
      json.register(Todo, TodoList)

      const todoList = new TodoList(
        new Todo("a", "Clean the house"),
        new Todo("b", "Do the dishes"),
        new Todo("c", "Walk the dogs")
      )

      const serialized = json.stringify(todoList)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(TodoList)
      expect(deserialized).toEqual(todoList)
    })
  })

  describe("decorated custom type", () => {
    @serialize
    class DecoratedTodo {
      constructor(readonly uuid: string, public text: string) {}

      static $revive(value: Serialized<DecoratedTodo>) {
        return new DecoratedTodo(value.uuid, value.text)
      }
    }

    it("serializes a decorated custom type", () => {
      const json = new Json()
      json.register(DecoratedTodo)

      const todo = new DecoratedTodo("a", "Clean the house")
      const serialized = json.stringify(todo)

      expect(serialized).toEqual(
        '{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"DecoratedTodo"}'
      )
    })

    it("deserializes a decorated custom type", () => {
      const json = new Json()
      json.register(DecoratedTodo)

      const todo = new DecoratedTodo("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(DecoratedTodo)
      expect(deserialized).toEqual(todo)
    })
  })

  describe("decorated custom type with custom reviver key", () => {
    @serializeAs("MyTodo")
    class DecoratedTodoCustomKey {
      constructor(readonly uuid: string, public text: string) {}

      static $revive(value: Serialized<DecoratedTodoCustomKey>) {
        return new DecoratedTodoCustomKey(value.uuid, value.text)
      }
    }

    it("serializes a custom type decorated with @serializable and a custom reviver key", () => {
      const json = new Json()
      json.register(DecoratedTodoCustomKey)

      const todo = new DecoratedTodoCustomKey("a", "Clean the house")
      const serialized = json.stringify(todo)

      expect(serialized).toEqual(
        '{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"MyTodo"}'
      )
    })

    it("deserializes a custom type decorated with @serializable and a custom reviver key", () => {
      const json = new Json()
      json.register(DecoratedTodoCustomKey)

      const todo = new DecoratedTodoCustomKey("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(DecoratedTodoCustomKey)
      expect(deserialized).toEqual(todo)
    })
  })
})
