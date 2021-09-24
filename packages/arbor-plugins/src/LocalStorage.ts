import { IStateTree, Path, Plugin } from "@arborjs/store"
import debounce from "./debounce"

/**
 * Describes a LocaStorage configuration object.
 */
export interface Config {
  key: string

  /**
   * Amount of milliseconds to debouce update calls by.
   *
   * This can be used to reduce the frequency in which data is written
   * back to local storage.
   */
  debounceBy?: number
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
  constructor(readonly config: Config) {
    this.deboucedUpdate = debounce((data: T) => {
      window.localStorage.setItem(this.config.key, JSON.stringify(data))
    }, config.debounceBy)
  }

  async configure(store: IStateTree<T>) {
    const data = await this.load()

    if (data && typeof data === "object") {
      const oldState = store.root.$unwrap()
      const root = store.setRoot(data)
      store.notify(Path.root, root, oldState)
    }

    store.subscribe(({ newState }) => {
      this.update(newState.$unwrap())
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
        resolve(JSON.parse(window.localStorage.getItem(this.config.key)))
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
