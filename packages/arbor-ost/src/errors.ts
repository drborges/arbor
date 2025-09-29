export class ArborError extends Error {}

export class DetachedPathError extends ArborError {
  constructor(humanizedPath: string) {
    super(
      `Path ${humanizedPath} is detached from the tree. Cannot perform mutation.`
    )
  }
}
