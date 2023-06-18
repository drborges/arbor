export const ArborSerializeAs = Symbol.for("ArborSerializeAs")

export type Typed = {
  $reviver: string
  $value: object
}

export type SerializedBy<T extends Serializable> = ReturnType<T["toJSON"]>

export type Serialized<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K]
}

export type Serializable = {
  toJSON(): object
}

export type Reviver<T = object> = Function & {
  $revive(obj: object): T
}

function isTyped(value: unknown): value is Typed {
  return value?.["$reviver"] != null && value?.["$value"] != null
}

/**
 * Provides a more flexible alternative to JSON.stringify / JSON.parse behaviors
 * adding support to user-defined types while adding very little boilerplate.
 */
export class Json {
  #revivers = new Map<string, Reviver>()

  /**
   * Decorator used to mark classes as serializable by @arborjs/json.
   *
   * Classes annotated will get a default toJSON implementation compatible with
   * the serialization algorithm implemented by the lib.
   */
  // NOTE: This must be an arrow function so "this" can be bound to the class instance when
  // called on the decorated class.
  serialize = <T extends Reviver>(target: T, _context: unknown = null) => {
    return this.serializeAs(target.name)(target, _context)
  }

  /**
   * Decorator used to make a class serializable by @arborjs/json with a custom
   * type serialization key.
   *
   * @param key key used to identify the class type so it can be deserialized back
   * to the correct type.
   */
  serializeAs<T extends Reviver>(key: string) {
    return (target: T, _context: unknown = null) => {
      const toJSON = target.prototype.toJSON

      target.prototype[ArborSerializeAs] = key || target.name

      target.prototype.toJSON = function () {
        // Leverage user-defined serialization logic if one is present
        if (toJSON) {
          return {
            $value: toJSON.call(this),
            $reviver: this[ArborSerializeAs],
          }
        }

        const $value = {}

        Object.keys(this).forEach((key) => {
          $value[key] = this[key]
        })

        return {
          $value,
          $reviver: this[ArborSerializeAs],
        }
      }

      this.register(target as Reviver)
    }
  }

  /**
   * Registers one or many {@link Reviver}s used to deserialize data.
   *
   * @param revivers a list of {@link Reviver} objects.
   */
  register(...revivers: Reviver[]) {
    revivers.forEach((reviver) => {
      const key = reviver.prototype[ArborSerializeAs] || reviver.name
      this.registerReviver(key, reviver)
    })
  }

  /**
   * Registers a {@link Reviver} identified by the given key.
   *
   * This can be used to register revivers for different types sharing the same name.
   *
   * @param key key that identifies the {@link Reviver} object.
   * @param reviver a {@link Reviver} to be used in the deserialization process.
   */
  registerReviver(key: string, reviver: Reviver) {
    this.#revivers.set(key, reviver)
  }

  /**
   * Serializes an object into a JSON string while tracking which {@link Reviver}
   * can be used to deserialize the value.
   *
   * @param value object to serialize into a string.
   * @returns the string representation of the object.
   */
  stringify(value: object): string {
    return JSON.stringify(value)
  }

  /**
   * Parses a JSON string deserializing the data into its original type via
   * the previously registered {@link Reviver} objects.
   *
   * @param value string to be parsed.
   * @returns the deserialized data type represented by the given string.
   */
  parse<T>(value: string): T {
    return JSON.parse(value, this.reviver.bind(this))
  }

  private reviver(_key: string, value: unknown) {
    if (isTyped(value)) {
      const Type = this.#revivers.get(value.$reviver)

      if (Type) {
        return Type.$revive(value.$value)
      }
    }

    return value
  }
}
