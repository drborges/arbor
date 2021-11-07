import Repository, { IRepository } from "@arborjs/repository"

import useArbor from "./useArbor"

export default function useRepository<T extends object, K>(
  repository: Repository<T>,
  selector?: (root: IRepository<T>) => K
) {
  const selection = useArbor(repository.store, selector)
  return [repository, selection] as [Repository<T>, K]
}
