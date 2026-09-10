import { StatusCodes } from "http-status-codes"

type DomainErrorStatus =
  | StatusCodes.BAD_REQUEST
  | StatusCodes.NOT_FOUND
  | StatusCodes.INTERNAL_SERVER_ERROR

export class DomainError extends Error {
  readonly key: string
  readonly status: DomainErrorStatus

  constructor(key: string, status: DomainErrorStatus) {
    super(key)
    this.key = key
    this.status = status
  }
}

export const notFound = (key: string) =>
  new DomainError(key, StatusCodes.NOT_FOUND)

export const invalidInput = (key: string) =>
  new DomainError(key, StatusCodes.BAD_REQUEST)

export const serverError = (key: string) =>
  new DomainError(key, StatusCodes.INTERNAL_SERVER_ERROR)
