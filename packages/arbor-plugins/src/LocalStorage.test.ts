import Arbor from "@arborjs/store"

import LocalStorage from "./LocalStorage"

class FakeLocalStorage implements Storage {
  length = 0
  store: { [key: string]: string } = {}
  subscribers = []
  key = () => ""

  onSetItem(subscriber: (val: unknown) => void) {
    this.subscribers.push(subscriber)
  }

  setItem(key: string, val: string) {
    this.store[key] = val
    this.subscribers.forEach((s) => s())
  }

  getItem(key: string) {
    return this.store[key]
  }

  clear() {
    this.store = {}
  }

  removeItem(key: string) {
    delete this.store[key]
  }
}

describe("LocalStorage", () => {
  it("initializes a given store with data retrieved from the local storage", async () => {
    global.localStorage = new FakeLocalStorage()

    const store = new Arbor({ text: "" })
    const plugin = new LocalStorage({ key: "the-key" })

    global.localStorage.setItem(
      "the-key",
      JSON.stringify({ text: "the app state" })
    )

    await plugin.configure(store)

    expect(store.root.text).toEqual("the app state")
  })

  it("updates the storage upon changes to the store", async () => {
    global.localStorage = new FakeLocalStorage()

    const store = new Arbor({ text: "some initial state" })
    const plugin = new LocalStorage({ key: "the-key" })

    await plugin.configure(store)

    return new Promise<void>((resolve) => {
      const fakeStorage = global.localStorage as FakeLocalStorage
      fakeStorage.onSetItem(() => {
        const expectedValue = JSON.stringify({ text: "a new state" })
        expect(global.localStorage.getItem("the-key")).toEqual(expectedValue)
        resolve()
      })

      store.root.text = "a new state"
    })
  })

  it("supports custom deserialization logic", async () => {
    global.localStorage = new FakeLocalStorage()

    const plugin = new LocalStorage<{ text: string }>({
      key: "the-key",
      deserialize: (data) => ({
        text: `!!${data.text}!!`,
      }),
    })

    const store = new Arbor({ text: "some initial state" })

    global.localStorage.setItem(
      "the-key",
      JSON.stringify({ text: "the app state" })
    )

    await plugin.configure(store)

    expect(store.root.text).toEqual("!!the app state!!")
  })
})
