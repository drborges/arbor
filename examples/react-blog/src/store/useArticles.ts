import Arbor, { useArbor } from "@arborjs/react"
import denormalizer from "@arborjs/denormalizer"

import { store as users, User } from "./useUsers"
import { store as comments, Comment } from "./useComments"

export interface Article {
  id: string
  title: string
  content: string
  authorId: string
  commentIds: string[]
}

export type DenormalizedFields = {
  author: User
  comments: Comment[]
}

export const store = new Arbor<Article[]>([
  {
    id: "1",
    title: "Article 1 Title",
    content: "Article 1's content",
    commentIds: ["1"],
    authorId: "1",
  },
])

export const denormalize = denormalizer<DenormalizedFields>({
  authorId: (id: string) => ({
    get author() {
      return users.root.find((u) => u.id === id)
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

export default function useArticles() {
  const articles = useArbor(store)

  return {
    articles,
  }
}
