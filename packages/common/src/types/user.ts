export type Role = "admin" | "manager"

export type Permission = "view" | "run" | "edit"

export interface User {
  id: string
  username: string
  displayName: string
  role: Role
  disabled: boolean
  createdAt: string
}

export interface PublicUser {
  id: string
  username: string
  displayName: string
  role: Role
  disabled: boolean
}

/** A quiz list entry annotated with the viewer's effective access. */
export interface QuizzListItem {
  id: string
  subject: string
  ownerId: string
  ownerName: string
  shared: boolean
  permission: Permission | "owner"
}
