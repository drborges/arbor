import { v4 } from "uuid"
import Arbor, { Node } from "@arborjs/store"

export type Record<T> = T & {
  id: string
}

export type Selector<T extends object> = {
  [P in keyof T]: T[P]
}

export type CopyFn<T> = (item: Record<T>) => Partial<Record<T>>
export type Predicate<T extends object> = (item: Record<T>) => boolean
export interface IRepository<T extends object> {
  [key: string]: Record<T>
}

const isFunction = (value: unknown): value is Function =>
  typeof value === "function"

export default class Repository<T extends object> {
  store: Arbor<IRepository<T>>

  constructor(
    storeOrInitialValue: Arbor<IRepository<T>> | IRepository<T>,
    private readonly uuid: () => string = v4
  ) {
    this.store =
      storeOrInitialValue instanceof Arbor
        ? storeOrInitialValue
        : new Arbor(storeOrInitialValue)
  }

  get all(): Record<T>[] {
    return Object.values(this.store.root)
  }

  clear(): void {
    this.store.setRoot({})
  }

  create(item: T): Record<T> {
    const id = this.uuid()

    this.store.root[id] = {
      ...item,
      id,
    }

    this.onCreate(id)

    return this.store.root[id] as Record<T>
  }

  createMany(...items: T[]): Record<T>[] {
    const rootCopy = { ...this.store.root.$unwrap() }

    const ids = items.map((item) => {
      const id = this.uuid()
      rootCopy[id] = {
        ...item,
        id,
      }
      return id
    })

    // This will update the store and trigger a single mutation.
    // If we were to delegate the operation to `this.create`, then a mutation
    // would be triggered for each item being created.
    //
    // Since there's currently no use-case for notifying subscribers on every
    // item creation, we'll prefere reducing the number of mutation events
    // being delivered.
    this.store.setRoot(rootCopy)

    return ids.map((id) => {
      this.onCreate(id)
      return this.store.root[id]
    })
  }

  delete(idOrRecord: string | Record<T>): T {
    const id = typeof idOrRecord === "string" ? idOrRecord : idOrRecord.id
    const item = this.store.root[id] as unknown as Node<T>
    delete this.store.root[id]
    this.onDelete(id)
    return item.$unwrap()
  }

  deleteBy(predicate: Predicate<T>): T[] {
    const rootCopy = { ...this.store.root.$unwrap() }
    const itemsToDelete = this.all.filter(predicate) as Node<Record<T>>[]

    itemsToDelete.forEach((item) => {
      delete rootCopy[item.id]
    })

    // This will update the store and trigger a single mutation.
    // If we were to delegate the operation to `this.delete`, then a mutation
    // would be triggered for each item being deleted.
    //
    // Since there's currently no use-case for notifying subscribers on every
    // item deletion, we'll prefere reducing the number of mutation events
    // being delivered.
    this.store.setRoot(rootCopy)

    return itemsToDelete.map((item) => {
      this.onDelete(item.id)
      return item.$unwrap()
    })
  }

  duplicate(idOrRecord: string | Record<T>): Record<T> {
    const id = typeof idOrRecord === "string" ? idOrRecord : idOrRecord.id
    const item = this.store.root[id]
    const copy = { ...item }
    const newItem = this.create(copy)
    this.onDuplicate(id)
    return newItem
  }

  duplicateBy(
    predicate: Predicate<T>,
    dataOrCopyFn: Partial<T> | CopyFn<T> = {}
  ): Record<T>[] {
    const rootCopy = { ...this.store.root.$unwrap() }
    const items = this.all.filter(predicate) as Node<Record<T>>[]

    const ids = items.map((item) => {
      const id = this.uuid()
      const copy = { ...item, id }
      const data = isFunction(dataOrCopyFn) ? dataOrCopyFn(copy) : dataOrCopyFn
      Object.assign(copy, data)
      rootCopy[id] = copy
      return id
    })

    // This will update the store and trigger a single mutation.
    // If we were to delegate the operation to `this.update`, then a mutation
    // would be triggered for each item being updated.
    //
    // Since there's currently no use-case for notifying subscribers on every
    // item update, we'll prefere reducing the number of mutation events
    // being delivered.
    this.store.setRoot(rootCopy)

    items.forEach((item) => this.onDuplicate(item.id))

    return ids.map((id) => this.store.root[id])
  }

  get(id: string): Record<T> {
    return this.store.root[id]
  }

  getBy(predicate: Predicate<T>): Record<T>[] {
    return this.all.filter(predicate)
  }

  update(
    idOrRecord: string | Record<T>,
    dataOrCopyFn: Partial<T> | CopyFn<T>
  ): Record<T> {
    const id = typeof idOrRecord === "string" ? idOrRecord : idOrRecord.id
    const item = this.store.root[id] as unknown as Node<T>

    this.store.mutate<Record<T>>(item.$path, (node) => {
      const data = isFunction(dataOrCopyFn) ? dataOrCopyFn(node) : dataOrCopyFn
      Object.assign(node, data)
    })

    this.onUpdate(id)

    return this.store.getNodeAt(item.$path)
  }

  updateBy(
    predicate: Predicate<T>,
    dataOrCopyFn: Partial<T> | CopyFn<T>
  ): Record<T>[] {
    const rootCopy = { ...this.store.root.$unwrap() }
    const itemsToUpdate = this.all.filter(predicate) as Node<Record<T>>[]

    itemsToUpdate.forEach((item) => {
      const copy = { ...item }
      const data = isFunction(dataOrCopyFn) ? dataOrCopyFn(copy) : dataOrCopyFn
      Object.assign(copy, data)
      rootCopy[copy.id] = copy
    })

    // This will update the store and trigger a single mutation.
    // If we were to delegate the operation to `this.update`, then a mutation
    // would be triggered for each item being updated.
    //
    // Since there's currently no use-case for notifying subscribers on every
    // item update, we'll prefere reducing the number of mutation events
    // being delivered.
    this.store.setRoot(rootCopy)

    return itemsToUpdate.map((item) => {
      this.onUpdate(item.id)
      return this.store.getNodeAt(item.$path)
    })
  }

  where(selector: Selector<Partial<T>>): Record<T>[] {
    const keys = Object.keys(selector)
    return this.all.filter((item) =>
      keys.every((key) => item[key] === selector[key])
    )
  }

  onCreate(_id: string) {}
  onDelete(_id: string) {}
  onDuplicate(_id: string) {}
  onUpdate(_id: string) {}
}
