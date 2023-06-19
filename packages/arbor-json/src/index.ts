import { Json } from "./Json"

export * from "./Json"

const json = new Json()

export const parse = json.parse.bind(json)
export const stringify = json.stringify.bind(json)
export const serializable = json.serializable.bind(json)
export const serializableAs = json.serializableAs.bind(json)
