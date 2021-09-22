export type Resolver<D extends object> = (ref: any) => Partial<D>

export interface Descriptor<D extends object> {
  [key: string]: Resolver<D>
}

export default function denormalizer<D extends object>(
  descriptor: Descriptor<D>
) {
  return <T extends object>(normalized: T) => {
    Object.keys(normalized).forEach((prop) => {
      if (descriptor.hasOwnProperty(prop)) {
        const resolver = descriptor[prop]
        const arg = normalized[prop]
        const denormalizedFields = resolver(arg)
        Object.keys(denormalizedFields).forEach((field) => {
          if (normalized.hasOwnProperty(field)) return

          Object.defineProperty(normalized, field, {
            enumerable: false,
            configurable: false,
            get() {
              return denormalizedFields[field]
            },
          })
        })
      }
    })

    return normalized as T & D
  }
}
