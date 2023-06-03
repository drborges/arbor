import { ArborNode, isArborNode, MutationEvent } from "@arborjs/store"

const parsePathPattern = (pathPattern: string): [RegExp, string | null] => {
  const processedWildcards = pathPattern.replace(/:\w+/g, ".*")
  const patternParts = processedWildcards.split("/")
  const lastPartIndex = patternParts.length - 1
  const lastPatternPart = patternParts[lastPartIndex]
  const endsWithPropName = lastPatternPart.startsWith("#")
  const pattern = endsWithPropName
    ? patternParts.slice(0, lastPartIndex).join("/")
    : processedWildcards
  const regex = new RegExp(`^${pattern}$`)

  return [regex, endsWithPropName ? lastPatternPart.slice(1) : null]
}

export function watchPaths(...patterns: string[]) {
  const parsedPatterns = patterns.map(parsePathPattern)

  return <T extends object>(node: ArborNode<T>, event: MutationEvent<T>) => {
    if (!isArborNode(node)) return false
    if (!event.mutationPath.affects(node)) return false

    return parsedPatterns.some(([regex, prop]) => {
      const matches = regex.test(event.mutationPath.toString())

      if (!matches) return false
      if (!prop) return true

      return event.metadata.props.includes(prop)
    })
  }
}
