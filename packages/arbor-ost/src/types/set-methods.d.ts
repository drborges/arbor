// Type declarations for new ECMAScript Set methods
// These methods are part of the Set Methods proposal and may not be included
// in all TypeScript lib definitions yet

/**
 * Represents a Set-like object that has the properties needed for Set operations.
 * This includes size, has(), and keys() methods as per the Set methods specification.
 */
export interface ReadonlySetLike<T> {
  /**
   * Returns the number of elements in the set.
   */
  readonly size: number

  /**
   * Returns true if the set contains the specified element.
   * @param value - The value to test for presence
   */
  has(value: T): boolean

  /**
   * Returns an iterator for the keys (values) in the set.
   */
  keys(): IterableIterator<T>
}

// Declare global Set interface augmentation
declare global {
  interface Set<T> {
    difference<U>(other: ReadonlySetLike<U>): Set<T>
    intersection<U>(other: ReadonlySetLike<U>): Set<T & U>
    union<U>(other: ReadonlySetLike<U>): Set<T | U>
    symmetricDifference<U>(other: ReadonlySetLike<U>): Set<T | U>
    isDisjointFrom<U>(other: ReadonlySetLike<U>): boolean
    isSubsetOf<U>(other: ReadonlySetLike<U>): boolean
    isSupersetOf<U>(other: ReadonlySetLike<U>): boolean
  }

  interface ReadonlySet<T> {
    difference<U>(other: ReadonlySetLike<U>): Set<T>
    intersection<U>(other: ReadonlySetLike<U>): Set<T & U>
    union<U>(other: ReadonlySetLike<U>): Set<T | U>
    symmetricDifference<U>(other: ReadonlySetLike<U>): Set<T | U>
    isDisjointFrom<U>(other: ReadonlySetLike<U>): boolean
    isSubsetOf<U>(other: ReadonlySetLike<U>): boolean
    isSupersetOf<U>(other: ReadonlySetLike<U>): boolean
  }
}
