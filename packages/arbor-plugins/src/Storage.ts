import { Arbor, MutationEvent, Plugin } from "@arborjs/store"

import debounce from "./debounce"

export interface Config<T extends object> {
  /**
   * Period in milliseconds after an update is processed in which
   * new updates are ignored.
   *
   * This helps ensure that the storage gets updated at most once
   * every so often based on the configured debounce period.
   */
  debounceBy?: number
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
export default abstract class Storage<T extends object> implements Plugin<T> {
  constructor(readonly config: Config<T>) {}

  /**
   * Initializes the plugin hooking into the given Arbor store.
   *
   * @param store the store to plug into.
   * @returns A promise that resolves with an unsusbcribe function that
   * can be used to unsubscribe from the given store.
   */
  async configure(store: Arbor<T>) {
    const data = await this.load()

    if (data && typeof data === "object") {
      store.setState(data)
    }

    return store.subscribe(this.deboucedUpdate)
  }
  /**
   * Provides the means to load data from the storage into the Arbor store.
   *
   * @returns a promise that resolves with the storage data.
   */
  abstract load(): Promise<T>
  /**
   * Updates the storage whenever a mutation to the store is made.
   *
   * @param event an Arbor store mutation event to handle.
   */
  abstract update(event: MutationEvent<T>): Promise<void>

  private deboucedUpdate = debounce(
    this.update.bind(this),
    this.config.debounceBy
  )
}
