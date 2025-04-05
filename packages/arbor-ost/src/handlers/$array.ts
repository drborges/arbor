import { Node } from "../types"
import { $push } from "./mutations"
import { $object, Prop } from "./$object"

export class $array<V> extends $object<V[]> {
  static accepts(value: unknown): boolean {
    return Array.isArray(value)
  }

  get(target: V[], prop: Prop, $node: Node<V[]>) {
    if (prop === "push") {
      return (...items: V[]) => {
        const arr = this.$ost.mutate($node, $push(items))
        return arr.length
      }
    }

    return super.get(target, prop, $node)
  }
}
