export type Typed = {
  $reviver: string
  $value: unknown
}

export type Serialized<T extends Serializable> = ReturnType<T["toJSON"]>

export type Serializable = {
  toJSON(): Typed
}

export type Reviver<T extends Serializable = Serializable> = Function & {
  $revive(obj: Serialized<T>): T
}

function isTyped(value: unknown): value is Typed {
  return value?.["$reviver"] != null && value?.["$value"] != null
}

export class Serializer {
  #revivers = new Map<string, Reviver>()

  register(...revivers: Reviver[]) {
    revivers.forEach((reviver) => {
      this.registerReviver(reviver.name, reviver)
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
        return Type.$revive(value)
      }
    }

    return value
  }
}
