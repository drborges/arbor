import Arbor from "./Arbor"
import mutate from "./mutate"
import Path from "./Path"

interface Address {
  street: string
}

interface Book {
  title: string
}

interface Author {
  name: string
  address: Address
  books: Book[]
}

interface State {
  author?: Author
}

describe("mutate", () => {
  it("computes the result of a mutation on a node path through structural sharing", () => {
    const tree = new Arbor<State>({})
    const node = tree.createNode(Path.root, {
      author: {
        name: "Bob",
        address: { street: "Baker St." },
        books: [{ title: "The adventures of Mr. Holmes" }],
      },
    })

    const address = node.author.address
    const books = node.author.books
    const book = node.author.books[0]

    const path = Path.parse("/author/address")
    const copy = mutate<State, Address>(node, path, (a) => {
      a.street = "Some other street"
    })

    expect(copy).not.toBe(node)
    expect(copy.author).not.toBe(node.author)
    expect(copy.author.address).not.toBe(address)
    expect(copy.author.books).toBe(books)
    expect(copy.author.books[0]).toBe(book)
    expect(copy).toEqual({
      author: {
        name: "Bob",
        address: { street: "Some other street" },
        books: [{ title: "The adventures of Mr. Holmes" }],
      },
    })
  })
})
