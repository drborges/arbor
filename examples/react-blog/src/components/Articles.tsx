import React from "react"
import { Link } from "react-router-dom"
import useArticles, {
  denormalize as denormalizeArticle,
} from "../store/useArticles"

export default function Articles() {
  const { articles } = useArticles()
  return (
    <div className="articles">
      <h1>Articles ({articles.length})</h1>
      <ol>
        {articles.map(denormalizeArticle).map((article) => {
          return (
            <li key={article.id}>
              <Link to={`/articles/${article.id}`}>
                {article.title} by {article.author.name}
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
