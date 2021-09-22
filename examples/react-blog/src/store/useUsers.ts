import Arbor, { useArbor } from "@arborjs/react"
import denormalizer from "@arborjs/denormalizer"

import { Article, store as articles } from "./useArticles"
import { Comment, store as comments } from "./useComments"

export interface User {
  id: string
  name: string
  articleIds: string[]
  commentIds: string[]
}

export type DenormalizedFields = {
  articles: Article[]
  comments: Comment[]
}

export const store = new Arbor<User[]>([
  { id: "1", name: "Diego", articleIds: [], commentIds: [] },
  { id: "2", name: "Bianca", articleIds: [], commentIds: [] },
])

export const denormalize = denormalizer<DenormalizedFields>({
  articleIds: (ids: string[]) => ({
    get articles() {
      return ids.map((id) =>
        articles.root.find((a) => a.id === id)
      ) as Article[]
    },
  }),
  commentIds: (ids: string[]) => ({
    get comments() {
      return ids.map((id) =>
        comments.root.find((c) => c.id === id)
      ) as Comment[]
    },
  }),
})

export default function useUsers() {
  const users = useArbor(store)

  return {
    users,
  }
}
