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
export default class LocalStorage<T extends object> extends Storage<T> {
  /**
   * Creates a new instance of the LocalStorage backend.
   *
   * @param key the key to be used in LocalStorage to reference the serialized state.
   */
  constructor(config: Config<T>) {
    super({
      debounceBy: config.debounceBy,

      load: () => {
        return new Promise<T>((resolve, reject) => {
          try {
            const data = window.localStorage.getItem(config.key) || "null"
            const deserialize =
              config.deserialize || (JSON.parse as typeof config.deserialize)

            resolve(deserialize(data))
          } catch (e) {
            reject(e)
          }
        })
      },

      update: (data: T): Promise<void> => {
        return new Promise((resolve, reject) => {
          try {
            const serialize = config.serialize || JSON.stringify
            window.localStorage.setItem(config.key, serialize(data))
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      },
    })
  }
}
