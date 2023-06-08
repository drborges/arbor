import { Arbor, Plugin } from "@arborjs/store"

import debounce from "./debounce"

export interface Config<T extends object> {
  /**
   * Amount in milliseconds to debouce by updates.
   */
  debounceBy?: number
  /**
   * Loads an Arbor store's state from a persistent storage.
   *
   * @returns the data to initialize the Arbor store.
   */
  load(): Promise<T>
  /**
   * Persists the state of the Arbor store into a storage.
   *
   * @param state the state to be persisted.
   */
  update(state: T): Promise<void>
}

/**
 * Represents a generic storage used to persist the state of an Arbor store.
 *
 * This provides the means to load an application's state from an arbitrary
 * storage into the Arbor store and keep that storage in sync with updates
 * made to the store.
 *
 * More specific storage implementations can extend this base class in order
 * to provide the persistency logic.
 */
export default class Storage<T extends object> implements Plugin<T> {
  protected deboucedUpdate: (data: T) => void

  constructor(readonly config: Config<T>) {
    this.deboucedUpdate = debounce((data: T) => {
      config.update(data)
    }, config.debounceBy)
  }

  /**
   * Initializes the plugin hooking into the given Arbor store.
   *
   * @example
   *
   * ```ts
   * store.use(new Storage({...}))
   * ```
   *
   * @param store the store to plug into.
   */
  async configure(store: Arbor<T>) {
    const data = await this.config.load()

    if (data && typeof data === "object") {
      store.setState(data)
    }

    store.subscribe(({ state }) => {
      void this.deboucedUpdate(state.current)
    })
  }
}
