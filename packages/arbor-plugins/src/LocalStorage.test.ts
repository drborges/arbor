import Arbor from "@arborjs/store"

import LocalStorage from "./LocalStorage"

describe("LocalStorage", () => {
  it("initializes a given store with data retrieved from the local storage", async () => {
    const store = new Arbor({ text: "" })
    const plugin = new LocalStorage({ key: "the-key" })

    window.localStorage.setItem(
      "the-key",
      JSON.stringify({ text: "the app state" })
    )

    await plugin.configure(store)

    expect(store.root.text).toEqual("the app state")
  })

  it("updates the storage upon changes to the store", async () => {
    const store = new Arbor({ text: "some initial state" })
    const plugin = new LocalStorage({ key: "the-key" })

    await plugin.configure(store)

    return new Promise<void>((resolve) => {
      store.subscribe(() => {
        setTimeout(() => {
          const expectedValue = JSON.stringify({ text: "a new state" })
          expect(window.localStorage.getItem("the-key")).toEqual(expectedValue)
          resolve()
        }, 500)
      })

      store.root.text = "a new state"
    })
  })

  it("supports custom deserialization logic", async () => {
    const plugin = new LocalStorage<{ text: string }>({
      key: "the-key",
      deserialize: (data) => ({
        text: `!!${data.text}!!`,
      }),
    })

    const store = new Arbor({ text: "some initial state" })

    window.localStorage.setItem(
      "the-key",
      JSON.stringify({ text: "the app state" })
    )

    await plugin.configure(store)

    expect(store.root.text).toEqual("!!the app state!!")
  })
})
