import "fake-indexeddb/auto"
import { IDBPDatabase, openDB } from "idb"
import Arbor, { ArborNode, Collection } from "@arborjs/store"

import IndexedDB, { Config } from "./IndexedDB"

const uuid = (
  (n = 0) =>
  () =>
    `uuid-${n}`
)()

class Todo extends ArborNode<Todo> {
  uuid = uuid()
  text!: string
  status = "todo"

  isVisible(currentFilter: string) {
    return this.status === currentFilter || currentFilter === "all"
  }
}

const config = {
  name: "app-state",
  version: 1,

  upgrade(db: IDBPDatabase) {
    if (Array.from(db.objectStoreNames).includes("todos")) {
      return
    }

    db.createObjectStore("todos", {
      keyPath: "uuid",
    })
  },
  async update(
    db: IDBPDatabase<Collection<Todo>>,
    todos: Collection<Todo>
  ): Promise<void> {
    const transaction = db.transaction(["todos"], "readwrite")
    const todoStore = transaction.objectStore("todos")
    await todoStore.clear()

    for (const todo of todos) {
      todoStore.put({ ...todo })
    }
  },
  async load(db: IDBPDatabase<Collection<Todo>>): Promise<Collection<Todo>> {
    const transaction = db.transaction(["todos"], "readwrite")
    const todosData: Todo[] = await transaction.objectStore("todos").getAll()
    const todos = todosData.map((data) => Object.assign(new Todo(), data))
    return new Collection<Todo>(...todos)
  },
} as Config<Collection<Todo>>

const indexedDBPlugin = new IndexedDB<Collection<Todo>>(config)

describe("IndexedDB", () => {
  it("initializes a given store with data retrieved from indexed db", async () => {
    const store = new Arbor(new Collection<Todo>())

    const db = await openDB("app-state", 1, {
      upgrade: config.upgrade,
    })

    const transaction = await db.transaction(["todos"], "readwrite")
    await transaction
      .objectStore("todos")
      .put({ uuid: uuid(), text: "Do the dishes", status: "todo" })

    await store.use(indexedDBPlugin)

    expect(store.root).toEqual({
      "uuid-0": new Todo({
        uuid: "uuid-0",
        text: "Do the dishes",
        status: "todo",
      }),
    })
  })

  it("persists Arbor state to IndexedDB upon every mutation", async () => {
    const store = new Arbor(new Collection<Todo>())
    await store.use(indexedDBPlugin)

    const updatePromise = new Promise((resolve) => {
      store.subscribe(() => {
        expect(store.root).toEqual({
          "uuid-0": new Todo({
            uuid: "uuid-0",
            text: "Do the dishes",
            status: "todo",
          }),
        })

        resolve(null)
      })
    })

    store.root.add(new Todo({ text: "Do the dishes" }))

    return updatePromise
  })
})
