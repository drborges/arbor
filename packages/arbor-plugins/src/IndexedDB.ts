import Arbor, { INode, Plugin } from "@arborjs/store"
import type { IDBPDatabase, OpenDBCallbacks } from "idb"

export type Config<T extends object> = OpenDBCallbacks<T> & {
  name: string
  version: number
  update(db: IDBPDatabase<T>, state: T): Promise<void>
  load(db: IDBPDatabase<T>): Promise<T>
}

export default class IndexedDB<T extends object> implements Plugin<T> {
  constructor(readonly config: Config<T>) {}

  async configure(store: Arbor<T>) {
    const { openDB } = await import("idb")
    const db = await openDB(this.config.name, this.config.version, this.config)
    const initialState = await this.config.load(db)

    store.setRoot(initialState)
    store.subscribe(({ state }) => {
      const value = (state.current as INode<T>).$unwrap()
      this.config.update(db, value)
    })
  }
}
