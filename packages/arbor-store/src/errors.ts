/* eslint-disable max-classes-per-file */

export class ArborError extends Error {}
export class MissingUUIDError extends ArborError {
  constructor() {
    super("Collection items must have a string 'uuid'")
  }
}
export class NotAnArborNodeError extends ArborError {
  constructor() {
    super("Object not bound to an Arbor store")
  }
}
