import React, { ChangeEvent, memo } from "react"

import useTodosFilter, { FilterValue, select } from "../store/useTodosFilter"
import Filter from "./Filter"

export default memo(function Filters() {
  const filter = useTodosFilter()
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    select(e.target.value as FilterValue)
  }

  return (
    <div className="filters">
      <Filter
        label="All"
        onChange={handleChange}
        selected={filter.value === "all"}
        value="all"
      />

      <Filter
        label="Active"
        onChange={handleChange}
        selected={filter.value === "active"}
        value="active"
      />

      <Filter
        label="Completed"
        onChange={handleChange}
        selected={filter.value === "completed"}
        value="completed"
      />
    </div>
  )
})
