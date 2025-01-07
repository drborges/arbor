// @vitest-environment jsdom

import { Arbor } from "@arborjs/store"
import { beforeEach, describe, expect, it, afterEach } from "vitest"

import LocalStorage, { VersionedSchema } from "../src/LocalStorage"

const timeout = (period = 0) =>
  new Promise((resolve) => {
    setTimeout(resolve, period)
  })

afterEach(() => {
  window.localStorage.clear()
})

describe("VersionedSchema", () => {
  it("should load when schemaVersion is not defined", () => {
    const versionedSchema = new VersionedSchema({ key: "the-key" })

    expect(versionedSchema.shouldLoad).toBe(true)
  })

  describe("when schemaVersion is defined", () => {
    it("loads when is the same as persisted version", () => {
      const versionedSchema = new VersionedSchema({
        key: "the-key",
        schemaVersion: "1",
      })
      window.localStorage.setItem(versionedSchema.schemaKey, "1")

      expect(versionedSchema.shouldLoad).toBe(true)
    })
  })
})

describe("LocalStorage", () => {
  beforeEach(() => {
    window.localStorage.removeItem("the-key")
  })

  it("initializes a given store with data retrieved from the local storage", async () => {
    const store = new Arbor({ text: "" })
    const plugin = new LocalStorage<{ text: string }>({ key: "the-key" })

    window.localStorage.setItem(
      "the-key",
      JSON.stringify({ text: "the app state" })
    )

    await store.use(plugin)

    expect(store.state.text).toEqual("the app state")
  })

  it("updates the local storage upon changes to the store", async () => {
    const store = new Arbor({ text: "some initial state" })
    const plugin = new LocalStorage<{ text: string }>({ key: "the-key" })

    await store.use(plugin)

    return new Promise<void>((resolve) => {
      store.subscribe(async () => {
        await timeout() // wait for the next clock tick to assert
        const expectedValue = JSON.stringify({ text: "a new state" })
        expect(window.localStorage.getItem("the-key")).toEqual(expectedValue)
        resolve()
      })

      store.state.text = "a new state"
    })
  })

  it("supports custom deserialization logic", async () => {
    const plugin = new LocalStorage<{ text: string }>({
      key: "the-key",
      deserialize: (data) => ({
        text: `!!${JSON.parse(data).text}!!`,
      }),
    })

    const store = new Arbor({ text: "some initial state" })

    window.localStorage.setItem(
      "the-key",
      JSON.stringify({ text: "the app state" })
    )

    await plugin.configure(store)

    expect(store.state.text).toEqual("!!the app state!!")
  })

  it("supports custom serialization logic", async () => {
    const plugin = new LocalStorage<{ text: string }>({
      key: "the-key",
      serialize(data) {
        return `text|${data.text}`
      },
      deserialize(data) {
        return {
          text: data.split("|")[1],
        }
      },
    })

    const store = new Arbor({ text: "some initial state" })
    await store.use(plugin)

    store.state.text = "Hello World!"

    return new Promise<void>(async (resolve) => {
      await timeout() // wait for the next clock tick to assert

      expect(window.localStorage.getItem("the-key")).toEqual(
        "text|Hello World!"
      )

      resolve()
    })
  })

  it("unsubscribes the plugin from any store updates", async () => {
    const plugin = new LocalStorage<{ text: string }>({
      key: "the-key",
    })

    const store = new Arbor({ text: "" })
    const unsubscribe = await store.use(plugin)

    store.state.text = "some initial state"

    await timeout()

    unsubscribe()

    // Will not update local storage now that the plugin is unsubscribed
    store.state.text = "Hello World!"

    await timeout()

    expect(window.localStorage.getItem("the-key")).toEqual(
      JSON.stringify({ text: "some initial state" })
    )
  })

  describe("schemaVersion", () => {
    it("always loads when schemaVersion config is not defined", async () => {
      const store = new Arbor({ text: "" })
      const plugin = new LocalStorage<{ text: string }>({ key: "the-key" })

      window.localStorage.setItem(
        "the-key",
        JSON.stringify({ text: "the app state" })
      )
      window.localStorage.setItem("the-key.schemaVersion", "1")

      await store.use(plugin)

      expect(store.state.text).toEqual("the app state")
    })

    it("loads when persisted schemaVersion is the same as the configuration", async () => {
      const store = new Arbor({ text: "" })
      const plugin = new LocalStorage<{ text: string }>({
        key: "the-key",
        schemaVersion: "1",
      })

      window.localStorage.setItem(
        "the-key",
        JSON.stringify({ text: "the app state" })
      )
      window.localStorage.setItem("the-key.schemaVersion", "1")

      await store.use(plugin)

      expect(store.state.text).toEqual("the app state")
    })

    it("doesn't load when persisted schemaVersion is different from the configuration", async () => {
      const store = new Arbor({ text: "" })
      const plugin = new LocalStorage<{ text: string }>({
        key: "the-key",
        schemaVersion: "2",
      })

      window.localStorage.setItem(
        "the-key",
        JSON.stringify({ text: "the app state" })
      )
      window.localStorage.setItem("the-key.schemaVersion", "1")

      await store.use(plugin)

      expect(store.state.text).toEqual("")
    })

    it("persists schemaVersion when its defined", async () => {
      const store = new Arbor({ text: "" })
      const plugin = new LocalStorage<{ text: string }>({
        key: "the-key",
        schemaVersion: "2",
      })

      window.localStorage.setItem(
        "the-key",
        JSON.stringify({ text: "the app state" })
      )

      await store.use(plugin)

      store.state.text = "Hello World!"
      await timeout()

      expect(window.localStorage.getItem("the-key.schemaVersion")).toEqual("2")
    })
  })
})
