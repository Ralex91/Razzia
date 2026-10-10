import { api, unwrap, unwrapEmpty } from "@razzia/web/lib/api"
import { queryOptions } from "@tanstack/react-query"

export const mediaKeys = {
  all: ["media"] as const,
}

export const mediaListQuery = () =>
  queryOptions({
    queryKey: mediaKeys.all,
    queryFn: () => unwrap(api.media.$get()),
  })

export const uploadMedia = (file: File) =>
  unwrap(api.media.$post({ form: { file } }), "errors:media.uploadFailed")

export const deleteMedia = (name: string) =>
  unwrapEmpty(api.media[":name"].$delete({ param: { name } }))
