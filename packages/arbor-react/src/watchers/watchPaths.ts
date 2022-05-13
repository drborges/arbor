import { ArborNode, isNode, MutationEvent } from "@arborjs/store";

const parsePathPattern = (pattern: string) => {
  const processedWildcards = pattern.replace(/:\w+/g, ".*")
  const patternParts = processedWildcards.split("/")
  const lastPartIndex = patternParts.length - 1
  const lastPatternPart = patternParts[lastPartIndex]
  const endsWithPropName = lastPatternPart.startsWith("#")
  const regex = endsWithPropName ? patternParts.slice(0, lastPartIndex).join("/") : processedWildcards
  return [`^${regex}$`, endsWithPropName ? lastPatternPart.slice(1) : null]
}

export function watchPaths(...pathPatterns: string[]) {
  return <T extends object>(node: ArborNode<T>) =>
    (event: MutationEvent<T>) => {
      if (!isNode(node)) return false
      if (!event.mutationPath.affects(node)) return false

      return pathPatterns.some(pattern => {
        const [path, prop] = parsePathPattern(pattern)
        const matches = new RegExp(path).test(event.mutationPath.toString())

        if (!matches) return false
        if (!prop) return true

        const previousNodeValue = event.mutationPath.walk(event.state.previous) as T
        const currentNodeValue = event.mutationPath.walk(event.state.current) as T
        return previousNodeValue[prop] !== currentNodeValue[prop]
      })
    }
}
