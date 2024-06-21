# Arbor

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/drborges)

## Caveats

Because of some of the constraints in the JavaScript language and design decisions in Arbor such as leveraging [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) as the mechanism to provide reactivity while enabling developers to interact with state as if it was a regular JS object/array, there are a few caveats to keep in mind that we'll try to cover here.

### ❌ Arrow Functions As Methods

In JavaScript the [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) keyword has always been a topic of discussion due to its "unconventional" behavior in the language which differs from most popular OOP languages that implement a similar concept.

> [!WARNING]
> "[Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) differ in their handling of this: they inherit this from the parent scope at the time they are defined. This behavior makes arrow functions particularly useful for callbacks and preserving context. However, **arrow functions do not have their own this binding**. Therefore, their this value cannot be set by bind(), apply() or call() methods, nor does it point to the current object in object methods."

In the context of Arbor, it means that we [cannot use arrow functions as object methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#cannot_be_used_as_methods). That's because every object in an Arbor store ends up being wrapped by a Proxy and their methods bound to the proxy itself so their execution happens within Arbor's context and the reactivity can take place.

Because we cannot bind an arrow function to the proxy, `this` within the arrow function will point to the underlying object wrapped by the proxy, and eventhough it will change that object's state correctly, no subscribers will be notified since the proxy is never aware of that change and cannot react to it.

### ⚠️ Private Properties

Using [Private Properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties) in your objects is not recommended. Arbor will proxy every object within its [state tree](StateTree.md) so it can provide the reactivity behavior to these objects while allowing you to leverage built-in JS constructs, such as assignment and APIs like `Array#push`, `Map#set`, etc...

This limitation comes from the fact that Proxies in JS [do not allow for private property forwarding](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_property_forwarding), in order words, proxies do not have direct access to private fields of the objects they are proxying.

### ⚠️ Custom Types

Don't forget to decorate your classes with `@proxiable` when defining custom types to represent parts of your state. If you don't decorate your classes Arbor will not provide reactivity on mutations triggered on their instances.

> [!NOTE]
> We may deprecate this decorator in the future if we learn that it's safe to proxy **any** object within Arbor's [state tree](StateTree.md), or if it would be safe to keep an internal list of types to treat as primitive values, such as `Date`, `Promise`, `BigInt`, etc...

**Example**:

```ts
@proxiable
class Todo {
  ...
}

@proxiable
class TodoList extends Array<Todo> {
  ...
}

const store = new Arbor(
  new TodoList(
    new Todo("Do the dishes"),
    new Todo("Walk the dogs")
  )
)
```
