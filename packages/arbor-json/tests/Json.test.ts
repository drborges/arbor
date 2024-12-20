import { describe, expect, it } from "vitest"
import {
  Json,
  Serialized,
  SerializedBy,
  parse,
  serializable,
  stringify,
} from "../src"

describe("Json", () => {
  describe("simple object", () => {
    it("serializes a simple object", () => {
      const json = new Json()
      const todos = [
        { uuid: "a", text: "Clean the house" },
        { uuid: "b", text: "Do the dishes" },
      ]

      const serialized = json.stringify(todos)

      expect(serialized).toEqual(
        '[{"uuid":"a","text":"Clean the house"},{"uuid":"b","text":"Do the dishes"}]'
      )
    })

    it("deserializes a simple object", () => {
      const todos = [
        { uuid: "a", text: "Clean the house" },
        { uuid: "b", text: "Do the dishes" },
      ]

      const json = new Json()
      const serialized = json.stringify(todos)
      const deserialized = json.parse(serialized)

      expect(deserialized).toEqual(todos)
    })
  })

  describe("custom type", () => {
    @serializable
    class Todo {
      constructor(readonly uuid: string, public text: string) {}

      static fromJSON(value: Serialized<Todo>) {
        return new Todo(value.uuid, value.text)
      }
    }

    @serializable
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

    it("serializes a custom type", () => {
      const todo = new Todo("a", "Clean the house")

      const serialized = stringify(todo)

      expect(serialized).toEqual(
        '{"$value":{"uuid":"a","text":"Clean the house"},"$type":"Todo"}'
      )
    })

    it("deserializes a custom type", () => {
      const todo = new Todo("a", "Clean the house")

      const serialized = stringify(todo)
      const deserialized = parse(serialized)

      expect(deserialized).toBeInstanceOf(Todo)
      expect(deserialized).toEqual(todo)
    })

    it("serializes a nested object made out of custom types", () => {
      const todoList = new TodoList(
        new Todo("a", "Clean the house"),
        new Todo("b", "Do the dishes"),
        new Todo("c", "Walk the dogs")
      )

      const serialized = stringify(todoList)

      expect(serialized).toEqual(
        '{"$value":[{"$value":{"uuid":"a","text":"Clean the house"},"$type":"Todo"},{"$value":{"uuid":"b","text":"Do the dishes"},"$type":"Todo"},{"$value":{"uuid":"c","text":"Walk the dogs"},"$type":"Todo"}],"$type":"TodoList"}'
      )
    })

    it("deserializes a nested object made out of custom types", () => {
      const todoList = new TodoList(
        new Todo("a", "Clean the house"),
        new Todo("b", "Do the dishes"),
        new Todo("c", "Walk the dogs")
      )

      const serialized = stringify(todoList)
      const deserialized = parse(serialized)

      expect(deserialized).toBeInstanceOf(TodoList)
      expect(deserialized).toEqual(todoList)
    })

    it("throws exception when custom type is not found", () => {
      const serialized =
        '{"$value":{"uuid":"a","text":"Clean the house"},"$type":"Task"}'

      expect(() => parse(serialized)).toThrow(
        "Unknown type: Task. Can't deserialize."
      )
    })
  })

  describe("custom type with custom $type key", () => {
    const json = new Json()

    @json.serializableAs("MyTodo")
    class Todo {
      constructor(readonly uuid: string, public text: string) {}

      static fromJSON(value: Serialized<Todo>) {
        return new Todo(value.uuid, value.text)
      }
    }

    it("serializes a custom type decorated with @serializable and a custom $type key", () => {
      const todo = new Todo("a", "Clean the house")
      const serialized = json.stringify(todo)

      expect(serialized).toEqual(
        '{"$value":{"uuid":"a","text":"Clean the house"},"$type":"MyTodo"}'
      )
    })

    it("deserializes a custom type decorated with @serializable and a custom $type key", () => {
      const todo = new Todo("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(Todo)
      expect(deserialized).toEqual(todo)
    })
  })

  describe("custom type with default deserializer", () => {
    const json = new Json()

    @json.serializable
    class Todo {
      constructor(readonly uuid: string, public text: string) {}
    }

    it("deserializes a custom type with a default deserialize logic", () => {
      const todo = new Todo("a", "Clean the house")

      const serialized = json.stringify(todo)
      const deserialized = json.parse(serialized)

      expect(deserialized).toBeInstanceOf(Todo)
      expect(deserialized).toEqual(todo)
    })
  })
})
