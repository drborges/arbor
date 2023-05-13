import Arbor, { INode, Plugin } from "@arborjs/store"

import debounce from "./debounce"

/**
 * Describes a LocaStorage configuration object.
 */
export interface Config<T extends object> {
  key: string

  /**
   * Amount of milliseconds to debouce update calls by.
   *
   * This can be used to reduce the frequency in which data is written
   * back to local storage.
   */
  debounceBy?: number

  /**
   * Used to deserialize the data retrieved from local storage.
   *
   * This can be used to convert plain objects into user defined data models.
   */
  deserialize?: (data: T) => T
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
      window.localStorage.setItem(this.config.key, JSON.stringify(data))
    }, config.debounceBy)
  }

  async configure(store: Arbor<T>) {
    const data = await this.load()
    const deserialize = this.config.deserialize || (() => data)
    const deserialized = deserialize(data)

    if (deserialized && typeof deserialized === "object") {
      store.setState(deserialized)
    }

    store.subscribe(({ state }) => {
      const node = state.current as INode<T>
      void this.update(node.$unwrap())
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
        resolve(
          JSON.parse(window.localStorage.getItem(this.config.key) || null) as T
        )
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
