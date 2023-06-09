import { Arbor, Plugin } from "@arborjs/store"

export class Logger<T extends object> implements Plugin<T> {
  constructor(readonly tag: string) {}

  async configure(store: Arbor<T>) {
    return store.subscribe((event) => {
      const operation = event.metadata?.operation?.toUpperCase()
      const path = event.mutationPath.toString()
      const props = event.metadata.props

      console.info(
        `%c[${this.tag}] ${operation} ${path}/${props.join(", ")}`.replace(
          "//",
          "/"
        ),
        "font-weight: bold;"
      )

      console.info(
        "  %ccurrent: %O",
        "color: lightgreen;",
        JSON.parse(JSON.stringify(event.state.current))
      )
      console.info(
        "  %cprevious: %O",
        "color: #ff4040",
        JSON.parse(JSON.stringify(event.state.previous))
      )
      console.info("")
    })
  }
}
