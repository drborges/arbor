export const ArborSerializeAs = Symbol.for("ArborSerializeAs")

export type Typed = {
  $reviver: string
  $value: object
}

export type SerializedExplicitly<T extends Serializable> = ReturnType<
  T["toJSON"]
>["$value"]

export type Serialized<T> = {
  [K in keyof T]: T[K]
}

export type Serializable = {
  toJSON(): Typed
}

export type Reviver<T = object> = Function & {
  $revive(obj: object): T
}

function isTyped(value: unknown): value is Typed {
  return value?.["$reviver"] != null && value?.["$value"] != null
}

export function serializeAs<T extends Function>(reviver: string) {
  return (target: T, _context: unknown = null) => {
    target.prototype[ArborSerializeAs] = reviver || target.name

    target.prototype.toJSON = function () {
      const $value = {}

      Object.keys(this).forEach((key) => {
        $value[key] = this[key]
      })

      return {
        $value,
        $reviver: this[ArborSerializeAs],
      }
    }
  }
}

export function serialize<T extends Function>(
  target: T,
  _context: unknown = null
) {
  return serializeAs(target.name)(target, _context)
}

export class Serializer {
  #revivers = new Map<string, Reviver>()

  register(...revivers: Reviver[]) {
    revivers.forEach((reviver) => {
      const key = reviver.prototype[ArborSerializeAs] || reviver.name
      this.registerReviver(key, reviver)
    })
  }

  registerReviver(key: string, reviver: Reviver) {
    this.#revivers.set(key, reviver)
  }

  stringify(value: object): string {
    return JSON.stringify(value)
  }

  parse<T>(obj: string): T {
    return JSON.parse(obj, this.reviver.bind(this))
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
