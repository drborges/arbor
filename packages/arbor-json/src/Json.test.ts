import { Json, Serialized, SerializedBy } from "./index"

const json = new Json()

@json.serialize
class Todo {
  constructor(readonly uuid: string, public text: string) {}

  static fromJSON(value: Serialized<Todo>) {
    return new Todo(value.uuid, value.text)
  }
}

@json.serialize
class TodoList extends Map<string, Todo> {
  constructor(...todos: Todo[]) {
    super(todos.map((todo) => [todo.uuid, todo]))
  }

  static fromJSON(value: SerializedBy<TodoList>) {
    return new TodoList(...value)
  }

  toJSON() {
    return Array.from(this.values())
  }
}

describe("Serializer", () => {
  describe("simple object", () => {
    it("serializes a simple object", () => {
      const todo = { uuid: "a", text: "Clean the house" }

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

      const serialized = json.stringify(todo)

      expect(serialized).toEqual(
        '{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"Todo"}'
      )
    })

    it("deserializes a custom type", () => {
      const todo = new Todo("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(Todo)
      expect(deserialized).toEqual(todo)
    })

    it("serializes a nested object made out of custom types", () => {
      const todoList = new TodoList(
        new Todo("a", "Clean the house"),
        new Todo("b", "Do the dishes"),
        new Todo("c", "Walk the dogs")
      )

      const serialized = json.stringify(todoList)

      expect(serialized).toEqual(
        '{"$value":[{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"Todo"},{"$value":{"uuid":"b","text":"Do the dishes"},"$reviver":"Todo"},{"$value":{"uuid":"c","text":"Walk the dogs"},"$reviver":"Todo"}],"$reviver":"TodoList"}'
      )
    })

    it("deserializes a nested object made out of custom types", () => {
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

  describe("custom type with custom reviver key", () => {
    const json = new Json()

    @json.serializeAs("MyTodo")
    class DecoratedTodoCustomKey {
      constructor(readonly uuid: string, public text: string) {}

      static fromJSON(value: Serialized<DecoratedTodoCustomKey>) {
        return new DecoratedTodoCustomKey(value.uuid, value.text)
      }
    }

    it("serializes a custom type decorated with @serializable and a custom reviver key", () => {
      const todo = new DecoratedTodoCustomKey("a", "Clean the house")
      const serialized = json.stringify(todo)

      expect(serialized).toEqual(
        '{"$value":{"uuid":"a","text":"Clean the house"},"$reviver":"MyTodo"}'
      )
    })

    it("deserializes a custom type decorated with @serializable and a custom reviver key", () => {
      const todo = new DecoratedTodoCustomKey("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(DecoratedTodoCustomKey)
      expect(deserialized).toEqual(todo)
    })
  })
})
