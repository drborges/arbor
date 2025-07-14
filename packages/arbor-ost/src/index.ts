import { Seed } from "./seed"
import { Node } from "./types"

export { OST } from "./ost"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNode(value: any): value is Node {
  return value?.$seed instanceof Seed
}
