import { Arbor, Plugin } from "@arborjs/store"

import debounce from "./debounce"

/**
 * Describes a LocaStorage configuration object.
 */
export interface Config<T extends object> {
  key: string

  /**
   * Amount in milliseconds to debouce by local storage updates.
   *
   * This can be used to reduce the frequency in which data is written
   * back to local storage.
   */
  debounceBy?: number

  /**
   * Serializes some data structure into its string representation to be
   * stored in the browser's local storage.
   *
   * @param data the data to serialize.
   * @returns the string representation of the data.
   */
  serialize?: (data: T) => string

  /**
   * Deserializes the data retrieved from local storage.
   *
   * @param serialized the serialized data structure retrieved from local storage.
   * @returns the deserialized version of the data.
   */
  deserialize?: (serialized: string) => T
}

/**
 * Arbor Storage implementation using window.localStorage as the backend.
 *
 * This provides LocalStorage-based persistence to Arbor state trees allowing
 * application state to be preserved across browser refreshes/sessions.
 */
export default class LocalStorage<T extends object> implements Plugin<T> {
  private deboucedUpdate: (data: T) => void

  /**
   * Creates a new instance of the LocalStorage backend.
   *
   * @param key the key to be used in LocalStorage to reference the serialized state.
   */
  constructor(readonly config: Config<T>) {
    this.deboucedUpdate = debounce((data: T) => {
      const serialize =
        config.serialize || (JSON.stringify as typeof config.serialize)

      window.localStorage.setItem(this.config.key, serialize(data))
    }, config.debounceBy)
  }

  /**
   * Runs the plugin's configuration/initialization logic.
   *
   * @param store the Arbor store to apply the plugin to.
   * @returns a Promise that resolves when configuration logic completes.
   */
  async configure(store: Arbor<T>) {
    const data = await this.load()

    if (data && typeof data === "object") {
      store.setState(data)
    }

    store.subscribe(({ state }) => {
      void this.update(state.current)
    })
  }

  /**
   * Loads the persisted data from window.localStorage.
   *
   * @returns a promise that resolves to the persisted data if successful.
   */
  async load(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        const data = window.localStorage.getItem(this.config.key) || "null"
        const deserialize =
          this.config.deserialize ||
          (JSON.parse as typeof this.config.deserialize)

        resolve(deserialize(data))
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Updates the LocalStorage with the given data.
   *
   * @param data the data to be persisted to window.localStorage.
   * @returns a Promise that resolves to void when the operation completes.
   */
  async update(data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.deboucedUpdate(data)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }
}
