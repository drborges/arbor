import React from "react"

import useTodosFilter, { Filter } from "../store/useTodosFilter"

export default function Filters() {
  const { current, select } = useTodosFilter()

  return (
    <div className="filters">
      <div className="filter">
        <input
          id="filter-all"
          type="radio"
          name="filter"
          checked={current === "all"}
          onChange={(e) => select(e.target.value as Filter)}
          value="all"
        />
        <label htmlFor="filter-all">All</label>
      </div>

      <div className="filter">
        <input
          id="filter-incompleted"
          type="radio"
          name="filter"
          checked={current === "incompleted"}
          onChange={(e) => select(e.target.value as Filter)}
          value="incompleted"
        />
        <label htmlFor="filter-incompleted">Active</label>
      </div>

      <div className="filter">
        <input
          id="filter-completed"
          type="radio"
          name="filter"
          checked={current === "completed"}
          onChange={(e) => select(e.target.value as Filter)}
          value="completed"
        />
        <label htmlFor="filter-completed">Completed</label>
      </div>
    </div>
  )
}
