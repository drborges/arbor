import React, { ChangeEvent } from "react"

import { FilterValue } from "../store/useTodosFilter"

interface FilterProps {
  label: string
  onChange(e: ChangeEvent<HTMLInputElement>): void
  selected: boolean
  value: FilterValue
}

export default function Filter({
  label,
  onChange,
  selected,
  value,
}: FilterProps) {
  return (
    <div className="filter">
      <input
        id={`filter-${value}`}
        type="radio"
        name="filter"
        checked={selected}
        onChange={onChange}
        value={value}
      />
      <label htmlFor={`filter-${value}`}>{label}</label>
    </div>
  )
}
