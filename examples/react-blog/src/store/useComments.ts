import Arbor, { useArbor } from "@arborjs/react"
import denormalizer from "@arborjs/denormalizer"

import { store as users, User } from "./useUsers"
import { Article, store as articles } from "./useArticles"

export interface Comment {
  id: string
  text: string
  authorId: string
  articleId: string
}

export type DenormalizedFields = {
  article: Article
  author: User
}

export const store = new Arbor<Comment[]>([
  { id: "1", text: "Comment 1", authorId: "1", articleId: "1" },
])

export const denormalize = denormalizer<DenormalizedFields>({
  authorId: (id: string) => ({
    get author() {
      return users.root.find((u) => u.id === id)
    },
  }),
  articleId: (id: string) => ({
    get article() {
      return articles.root.find((a) => a.id === id)
    },
  }),
})

export default function useComments() {
  const comments = useArbor(store)

  return {
    comments,
  }
}
