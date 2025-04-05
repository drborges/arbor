import { VisitParams, Visitor } from "./visitor"

export class Visitors extends Array<Visitor> {
  visit(params: VisitParams) {
    return this.find(v => v.accepts(params))?.visit(params)
  }
}
