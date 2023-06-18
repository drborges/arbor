import { Json } from "./Json"

export * from "./Json"

const json = new Json()

export const serialize = json.serialize
export const serializeAs = json.serializeAs
export const parse = json.parse.bind(json)
export const stringify = json.stringify.bind(json)
