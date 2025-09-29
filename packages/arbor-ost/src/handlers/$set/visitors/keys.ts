import { ValuesVisitor } from "./values"

// As per MDN's docs, Set#keys is simply an alias for Set#values.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/keys
export class KeysVisitor extends ValuesVisitor {
  prop = "keys"
}
