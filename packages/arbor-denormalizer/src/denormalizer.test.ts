import denormalizer from "./denormalizer"

interface User {
  id: number
  name: string
}

interface Post {
  id: number
  text: string
}

interface Authorable {
  author: User
}

interface Author {
  posts: Post[]
}

describe("denormalizer", () => {
  it("resolves a one-to-many association", () => {
    const users = [
      { id: 1, name: "Alice", postIds: [1, 2] },
      { id: 2, name: "Bob", postIds: [3] },
    ]

    const posts = [
      { id: 1, text: "Post 1" },
      { id: 2, text: "Post 2" },
      { id: 3, text: "Post 3" },
    ]

    const denormalizeUser = denormalizer<Author>({
      postIds: (ids: number[]) => ({
        get posts() {
          return ids.map((id) => posts.find((p) => p.id === id))
        },
      }),
    })

    const denormalizedUser1 = denormalizeUser(users[0])
    const denormalizedUser2 = denormalizeUser(users[1])

    expect(denormalizedUser1.posts[0]).toBe(posts[0])
    expect(denormalizedUser1.posts[1]).toBe(posts[1])
    expect(denormalizedUser1.posts).toEqual([posts[0], posts[1]])
    expect(denormalizedUser1).toEqual({
      id: 1,
      name: "Alice",
      postIds: [1, 2],
    })

    expect(denormalizedUser2.posts[0]).toBe(posts[2])
    expect(denormalizedUser2.posts).toEqual([posts[2]])
    expect(denormalizedUser2).toEqual({
      id: 2,
      name: "Bob",
      postIds: [3],
    })
  })

  it("resolves a one-to-one association", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]

    const posts = [
      { id: 1, text: "Post 1", authorId: 1 },
      { id: 2, text: "Post 2", authorId: 2 },
    ]

    const denormalizePost = denormalizer<Authorable>({
      authorId: (id: number) => ({
        get author() {
          return users.find((u) => u.id === id)
        },
      }),
    })

    const denormalizedPost1 = denormalizePost(posts[0])
    const denormalizedPost2 = denormalizePost(posts[1])

    expect(denormalizedPost1.author).toBe(users[0])
    expect(denormalizedPost1).toEqual({
      id: 1,
      text: "Post 1",
      authorId: 1,
    })

    expect(denormalizedPost2.author).toBe(users[1])
    expect(denormalizedPost2).toEqual({
      id: 2,
      text: "Post 2",
      authorId: 2,
    })
  })
})
