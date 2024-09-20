import { proxiable } from "@arborjs/store"

@proxiable
export class ShortCircuitApp {
  flag1 = false
  flag2 = false
  flag3 = false

  toggleFlag1() {
    this.flag1 = !this.flag1
  }

  toggleFlag2() {
    this.flag2 = !this.flag2
  }

  toggleFlag3() {
    this.flag3 = !this.flag3
  }
}
