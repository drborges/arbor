import { Arbor, Plugin } from "@arborjs/store"

const sliceObject = (obj: object, props: string[]) =>
  Object.fromEntries(
    Object.entries(obj).filter((value) =>
      props.length > 0 ? props.includes(value[0]) : true
    )
  )

export default class Logger<T extends object> implements Plugin<T> {
  /**
   * Creates a new instance of the plugin.
   *
   * @param tag a string value identifying the store it is bound to.
   */
  constructor(readonly tag: string) {}

  async configure(store: Arbor<T>) {
    store.subscribe(({ metadata, mutationPath, state }) => {
      const { operation, props } = metadata

      const previousValue = mutationPath.walkObj(state.previous || {}) as T
      const currentValue = mutationPath.walkObj(state.current) as T

      const isPropDeletion = operation === "delete"
      const previous = sliceObject(previousValue || {}, props)
      const current = sliceObject(currentValue || {}, props)

      console.group(
        `${this.tag} ${operation.toUpperCase()} ${
          isPropDeletion
            ? mutationPath.child(props[0]).toString()
            : mutationPath.toString()
        }`
      )

      switch (operation) {
        case "push":
          console.info(JSON.stringify(current[props[0]], null, 2))
          break
        case "delete":
          console.info(JSON.stringify(previous[props[0]], null, 2))
          break
        case "set":
        case "merge":
          if (props.length > 0) {
            console.table(
              props.map((prop) => ({
                prop,
                previous: previous[prop] as T,
                current: current[prop] as T,
              }))
            )
          } else {
            console.info("current:", JSON.stringify(current, null, 2))
            console.info("previous:", JSON.stringify(previous, null, 2))
          }
          break
        default:
          console.info("current:", JSON.stringify(current, null, 2))
          console.info("previous:", JSON.stringify(previous, null, 2))
      }

      console.groupEnd()
    })

    return Promise.resolve()
  }
}
