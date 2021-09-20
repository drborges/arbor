export interface Descriptor<K extends object> {
  [key: string]: (ref: number | number[] | string | string[]) => K
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
          Object.defineProperty(normalized, field, {
            get: () => denormalizedFields[field],
            enumerable: false,
            configurable: false,
          })
        })
      }
    })

    return normalized as T & D
  }
}
