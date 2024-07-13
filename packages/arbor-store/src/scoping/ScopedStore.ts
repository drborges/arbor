import { Arbor } from "../Arbor"
import { ArborError } from "../errors"
import { isNode } from "../guards"
import { ArborNode, Store, Subscriber, Unsubscribe } from "../types"
import { pathFor } from "../utilities"
import { Scope } from "./Scope"

export class ScopedStore<T extends object> implements Store<T> {
  protected originalStore: Arbor<T>
  protected targetNode: ArborNode<T>
  readonly scope = new Scope()

  constructor(storeOrNode: Arbor<T> | ArborNode<T>) {
    if (isNode(storeOrNode)) {
      this.originalStore = storeOrNode.$tree as Arbor<T>
      this.targetNode = storeOrNode as ArborNode<T>
    } else if (storeOrNode instanceof Arbor) {
      this.originalStore = storeOrNode
      this.targetNode = storeOrNode.state as ArborNode<T>
    } else {
      throw new ArborError("track takes either an Arbor store or an ArborNode")
    }

    this.scope.track(this.targetNode)
  }

  get state() {
    return this.scope.getOrCache(
      this.originalStore.getNodeAt(pathFor(this.targetNode))
    ) as ArborNode<T>
  }

  setState(value: T): ArborNode<T> {
    this.targetNode = this.originalStore.setNode(this.targetNode, value)

    return this.state
  }

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.subscribeTo(this.targetNode, subscriber)
  }

  subscribeTo<V extends object>(
    node: ArborNode<V>,
    subscriber: Subscriber<T>
  ): Unsubscribe {
    return this.originalStore.subscribeTo(node, (event) => {
      if (this.scope.affected(event)) {
        subscriber(event)
      }
    })
  }
}
