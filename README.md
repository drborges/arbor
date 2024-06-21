# Arbor

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

A fully typed reactive state management library with very little boilerplate.

## Why Arbor?

Arbor is not just another state management library, it focuses on developer experience and productivity by getting out of your way and letting you focus on your application logic.

Here are some of the core concepts driving Arbor's development:

- **Small API**: We try to keep Arbor's public API as minial as possible to reduce the initial learning curve;
- **Minimal Boilerplate**: Developers should focus on their application logic not "plumbing logic" like state management;
- **Built-in Reactivity**: State is observable (thanks to [ES6 Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)) meaning different parts of your application can subscribe to specific parts of the application state and react to changes accordingly;
- **Extensible**: We provide a plugins system (experimental at the moment) that allows developers to extend Arbor with new functionality such as [logging](packages/arbor-plugins/docs/Logger.md), [persistency](packages/arbor-plugins/docs/Storage.md), [developer tools](packages/arbor-plugins/docs/DevTools.md) or [your own custom Plugin](packages/arbor-store/docs/CustomPlugins.md);
- **No Dependencies**: Arbor is small an has no external dependencies keeping your application footprint under control;
- **Framework Agnostic**: It can be used in vanilla JS apps, or with a framework of your choice through a [binding](packages/arbor-store/docs/Bindings.md);
- **Official React Support**: Even though it's framework agnostic, we provide an official [React Binding](packages/arbor-react/README.md) that makes managing state of React apps fun again;
- **Powered by TypeScript**: Benefit from a strong type system to help you catch compile-time bugs while leveraging other goodies like powerful intelisense and refactoring tools on your editor of choice.

## Documentation

> [!NOTE]
> Our docs are constantly being polished and we are trying to make it easy to navigate and digest. Feel free to open a PR with improvements to the docs.

- Getting Started
  - [Vanilla JS](packages/arbor-store/README.md)
  - [React](packages/arbor-react/README.md)
  - [Building a Data Model]()
  - [Caveats](packages/arbor-store/docs/Caveats.md)
  - [Server Side Rendering](packages/arbor-store/docs/Ssr.md)
  - [Troubleshooting](packages/arbor-store/docs/Troubleshooting.md)
  - [Tips & Tricks](docs/TipsAndTricks.md)
  - [How Does Arbor Work?](packages/arbor-store/docs/HowDoesArborWork.md)
- Learn by Example:
  - [React Counter App](https://codesandbox.io/p/sandbox/counter-app-yj26xb)
  - [React Todo App](https://codesandbox.io/p/sandbox/base-todo-app-pzgld3)
  - [React Payments App](https://codesandbox.io/p/sandbox/payments-app-nvtcrm)
- Plugins:
  - [Logging](): Get visibility into how your state changes;
  - [LocalStorage Persitency](): Persist the state of your store to the browser's local storage;
  - [Backend Persistency](): Persist the state of your store to a backend service.

Help us improve our docs, PRs are very welcome!

## Contributing

> ![IMPORTANT]
> Comming soon!

We are currently working on polishing our docs and will soon provide some guidelines to how contribute to this project.

## Support This Project

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## License

Arbor is [MIT licensed](./LICENSE.md).
