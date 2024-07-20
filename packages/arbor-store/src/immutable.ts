import { Arbor } from "./arbor"
import { SnapshotEngine } from "./engines"

/**
 * Relies on structural sharing algorithm to generate state snapshots
 * as the store gets mutates.
 *
 * @experimental
 */
export class ImmutableArbor<T extends object> extends Arbor<T> {
  protected readonly engine = new SnapshotEngine<T>(this)
}
