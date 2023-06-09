import { MutationEvent } from "@arborjs/store"

import Storage from "./Storage"

/**
 * Describes a LocaStorage configuration object.
 */
export interface Config<T extends object> {
  /**
   * The local storage key to reference the store data.
   */
  key: string
  /**
   * Period in milliseconds after an update is processed in which
   * new updates are ignored.
   *
   * This helps ensure that the local storage gets updated at most once
   * every so often based on the configured debounce period.
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
 *
 * @example
 *
 * ```ts
 * store.use(new LocalStorage({
 *   key: "MyAppState",
 *   debounceBy: 100,
 * }))
 * ```
 */
export default class LocalStorage<T extends object> extends Storage<T> {
  constructor(readonly config: Config<T>) {
    super(config)
  }

  load() {
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

  update(event: MutationEvent<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const serialize = this.config.serialize || JSON.stringify
        window.localStorage.setItem(
          this.config.key,
          serialize(event.state.current)
        )
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }
}
