import Repository from "@arborjs/repository"
import { act, renderHook } from "@testing-library/react-hooks/native"

import useRepository from "./useRepository"

interface User {
  name: string
}

describe("useRepository", () => {
  it("returns an array with the repository and the current root of the state tree", () => {
    const respository = new Repository<User>({
      "1": { id: "1", name: "Alice" },
      "2": { id: "2", name: "Bob" },
    })

    const { result } = renderHook(() => useRepository(respository))

    expect(result.current[0]).toBe(respository)
    expect(result.current[1]).toBe(respository.store.root)
  })

  it("allows selecting a specific path in the state tree to bind the component to", () => {
    const respository = new Repository<User>({
      "1": { id: "1", name: "Alice" },
      "2": { id: "2", name: "Bob" },
    })

    const { result } = renderHook(() =>
      useRepository(respository, (root) => root["2"])
    )

    expect(result.current[0]).toBe(respository)
    expect(result.current[1]).toBe(respository.store.root["2"])
  })

  it("recomputes the state whenever a store mutation is triggered", () => {
    const respository = new Repository<User>({
      "1": { id: "1", name: "Alice" },
      "2": { id: "2", name: "Bob" },
    })

    const { result } = renderHook(() => useRepository(respository))

    act(() => {
      result.current[0].delete("1")
    })

    expect(result.current[0].all).toEqual([respository.get("2")])
  })
})
