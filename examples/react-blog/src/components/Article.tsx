import React from "react"
import { useParams } from "react-router-dom"
import { denormalize as denormalizeComment } from "../store/useComments"
import useArticles, {
  denormalize as denormalizeArticle,
} from "../store/useArticles"

export default function Article() {
  const { id } = useParams<{ id: string }>()
  const { articles } = useArticles()
  const a = articles.find((a) => a.id === id)
  if (!a) return "Article not found"

  const article = denormalizeArticle(a)

  return (
    <div className="article">
      {article && (
        <>
          <h1>
            {article.title} by {article.author.name}
          </h1>
          <p>{article.content}</p>
          <h2>Comments</h2>
          <ul>
            {article.comments.map(denormalizeComment).map((comment) => (
              <li>
                {comment.author.name}: {comment.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
