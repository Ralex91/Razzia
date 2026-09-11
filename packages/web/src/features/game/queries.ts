import { api, unwrap } from "@razzia/web/lib/api"
import { queryOptions } from "@tanstack/react-query"

export const checkInviteCode = (inviteCode: string) =>
  unwrap(api.games.check.$post({ json: { inviteCode } }))

export const inviteCodeQuery = (inviteCode: string) =>
  queryOptions({
    queryKey: ["games", inviteCode] as const,
    queryFn: () => checkInviteCode(inviteCode),
    staleTime: 0,
  })

export const joinGame = (json: { inviteCode: string; username: string }) =>
  unwrap(api.games.join.$post({ json }))
