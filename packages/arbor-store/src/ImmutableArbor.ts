import { Arbor } from "./Arbor"
import { MutationEngine } from "./MutationEngine"

/**
 * @experimental it appears we don't necessarily have to go full immutable to leverage React 18
 * concurrent mode so we'll likely end up removing the 'snapshot' mutation mode idea.
 */
export class ImmutableArbor<T extends object> extends Arbor<T> {
  protected readonly engine = new MutationEngine<T>(this, "snapshot")
}
