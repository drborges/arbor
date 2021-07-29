import Arbor from "./Arbor"
import stitch from "./stitch"

type User = {
  name: string
}

type Post = {
  content: string
}

type AppState = {
  users: User[]
  posts: Post[]
}

describe("stitch", () => {
  it("creates a new store by stitching two other stores together", () => {
    const userStore = new Arbor<User[]>([])
    const postStore = new Arbor<Post[]>([])
    const appStore = stitch<AppState>({
      users: userStore,
      posts: postStore,
    })

    expect(appStore.root.users).toEqual(userStore.root)
    expect(appStore.root.posts).toEqual(postStore.root)
    expect(appStore.root).toEqual({
      users: userStore.root,
      posts: postStore.root,
    })
  })

  it("propagates updates from underlying stores to the stitched store", () => {
    const userStore = new Arbor<User[]>([])
    const postStore = new Arbor<Post[]>([])
    const appStore = stitch<AppState>({
      users: userStore,
      posts: postStore,
    })

    appStore.subscribe((nextState) => {
      expect(nextState).toEqual({
        users: [],
        posts: [{ content: "A new post" }],
      })
    })

    postStore.root.push({ content: "A new post" })
  })

  it("can update the underlying stores through the stitched store", () => {
    const userStore = new Arbor<User[]>([])
    const postStore = new Arbor<Post[]>([])
    const appStore = stitch<AppState>({
      users: userStore,
      posts: postStore,
    })

    appStore.subscribe((nextState) => {
      expect(nextState).toEqual({
        users: [],
        posts: [{ content: "A new post" }],
      })
    })

    appStore.root.posts.push({ content: "A new post" })
  })

  it("propagates updates to underlying store when updating the stitched store's root keys", () => {
    const userStore = new Arbor<User[]>([])
    const postStore = new Arbor<Post[]>([])
    const appStore = stitch<AppState>({
      users: userStore,
      posts: postStore,
    })

    appStore.subscribe((nextState) => {
      expect(postStore.root).toEqual(nextState.posts)
      expect(nextState).toEqual({
        users: [],
        posts: [{ content: "A new post" }],
      })
    })

    appStore.root.posts = [{ content: "A new post" }]
  })

  it("restores deleted root keys when underlying store is updated", () => {
    /*
     * TODO: revisit this behavior. It might be more interesting to detect root
     * key deletions and automatically unsubscribe the stitched store from the
     * underlying store corresponding to the deleted root key.
     */
    const userStore = new Arbor<User[]>([])
    const postStore = new Arbor<Post[]>([])
    const appStore = stitch<AppState>({
      users: userStore,
      posts: postStore,
    })

    const unsubscribe1 = appStore.subscribe((nextState) => {
      expect(nextState).toEqual({
        users: [],
      })
    })

    delete appStore.root.posts
    unsubscribe1()

    appStore.subscribe((nextState) => {
      expect(nextState).toEqual({
        users: [],
        posts: [{ content: "some post" }],
      })
    })

    postStore.root.push({ content: "some post" })
  })
})
