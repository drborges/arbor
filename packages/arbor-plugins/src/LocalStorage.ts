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
  /**
   * If schemaVersion persisted in localStorage is different then the defined by this property.
   * It will ignore persisted data. Change this value when there's a breaking change in the schema.
   *
   * The plugin will not compare schemaVersions if this value is not defined.
   */
  schemaVersion?: string
  /**
   * Overrides default key  name for persisted schemaVersion
   */
  schemaVersionKey?: string
}

export class VersionedSchema {
  config: Config<object>

  constructor(config: Config<object>) {
    this.config = config
  }

  get schemaKey() {
    return this.config.schemaVersionKey || `${this.config.key}.schemaVersion`
  }

  get shouldLoad() {
    const { schemaVersion } = this.config
    return !schemaVersion || this.persistedSchemaVersion === schemaVersion
  }

  get persistedSchemaVersion() {
    return window.localStorage.getItem(this.schemaKey)
  }

  persist() {
    if (!this.config.schemaVersion) {
      return
    }

    window.localStorage.setItem(this.schemaKey, this.config.schemaVersion)
  }
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
  versionedSchema: VersionedSchema

  constructor(readonly config: Config<T>) {
    super(config)
    this.versionedSchema = new VersionedSchema(config)
  }

  load() {
    return new Promise<T>((resolve, reject) => {
      try {
        const data = window.localStorage.getItem(this.config.key) || "null"
        const deserialize =
          this.config.deserialize ||
          (JSON.parse as typeof this.config.deserialize)

        resolve(this.versionedSchema.shouldLoad ? deserialize(data) : null)
      } catch (e) {
        reject(e)
      }
    })
  }

  update(event: MutationEvent<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const serialize = this.config.serialize || JSON.stringify
        window.localStorage.setItem(this.config.key, serialize(event.state))

        this.versionedSchema.persist()

        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }
}
