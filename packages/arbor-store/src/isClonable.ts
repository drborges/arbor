import { Clonable } from "./Arbor"

export default function isClonable<T extends object>(
  value: any
): value is Clonable<T> {
  const isNodeValue = value as Clonable<T>
  return typeof isNodeValue?.$clone === "function"
}
