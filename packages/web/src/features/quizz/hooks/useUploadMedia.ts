import { ACCEPTED_MEDIA_TYPES, MAX_MEDIA_SIZE } from "@razzia/common/constants"
import type { UploadedMedia } from "@razzia/common/types/game"
import { mediaKeys, uploadMedia } from "@razzia/web/features/quizz/queries"
import { ApiError } from "@razzia/web/lib/api"
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

export const UPLOAD_ACCEPT = Object.entries(ACCEPTED_MEDIA_TYPES)
  .flatMap(([mime, { ext }]) => [mime, ext])
  .join(",")

const uploadKey = [...mediaKeys.all, "upload"] as const

export const useUploadMedia = (
  onUploaded?: (_media: UploadedMedia) => void,
) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const pendingCount = useIsMutating({ mutationKey: uploadKey })

  const { mutate } = useMutation({
    mutationKey: uploadKey,
    mutationFn: uploadMedia,
    onSuccess: (media) => onUploaded?.(media),
    onError: (error) =>
      toast.error(
        t(error instanceof ApiError ? error.key : "errors:media.uploadFailed"),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  })

  const upload = (files: Iterable<File>) => {
    for (const file of files) {
      if (file.size > MAX_MEDIA_SIZE) {
        toast.error(t("errors:media.tooLarge"))

        continue
      }

      mutate(file)
    }
  }

  return { upload, pendingCount }
}
