/* eslint-disable max-classes-per-file */

export class ArborError extends Error {}
export class MissingUUIDError extends ArborError {
  constructor() {
    super("Repository items must implement the 'Record' type")
  }
}

export class InvalidArgumentError extends ArborError {}

export class ValueAlreadyBoundError extends ArborError {}

export class NotAnArborNodeError extends ArborError {
  constructor() {
    super("Object not bound to an Arbor store")
  }
}

export class DetachedNodeError extends ArborError {
  constructor() {
    super("Mutation attempt on a stale node")
  }
}
