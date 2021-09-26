/**
 * Allows for user defined data models.
 */
export default class Model<T extends object> {
  constructor(props: Partial<T>) {
    Object.assign(this, props)
  }

  $clone(): T {
    const Class = this.constructor as ObjectConstructor
    return new Class({ ...this }) as T
  }
}
