import React, { ChangeEvent } from "react"

import useTodosFilter, { FilterValue } from "../store/useTodosFilter"
import Filter from "./Filter"

export default function Filters() {
  const { current, select } = useTodosFilter()
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    select(e.target.value as FilterValue)

  return (
    <div className="filters">
      <Filter
        label="All"
        onChange={handleChange}
        selected={current === "all"}
        value="all"
      />

      <Filter
        label="Active"
        onChange={handleChange}
        selected={current === "incompleted"}
        value="incompleted"
      />

      <Filter
        label="Completed"
        onChange={handleChange}
        selected={current === "completed"}
        value="completed"
      />
    </div>
  )
}
