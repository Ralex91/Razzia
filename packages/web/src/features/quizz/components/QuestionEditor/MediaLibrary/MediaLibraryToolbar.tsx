import { MEDIA_TYPES } from "@razzia/common/constants"
import type { UploadedMediaType } from "@razzia/common/types/game"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@razzia/web/components/Select"
import { UPLOAD_ACCEPT } from "@razzia/web/features/quizz/hooks/useUploadMedia"
import { Search, Upload } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

export type MediaFilter = "all" | UploadedMediaType

const FILTERS: Array<{ value: MediaFilter; labelKey: string }> = [
  { value: "all", labelKey: "quizz:media.filter.all" },
  { value: MEDIA_TYPES.IMAGE, labelKey: "quizz:question.media.image" },
  { value: MEDIA_TYPES.AUDIO, labelKey: "quizz:question.media.audio" },
  { value: MEDIA_TYPES.VIDEO, labelKey: "quizz:question.media.video" },
]

interface Props {
  search: string
  onSearchChange: (_search: string) => void
  filter: MediaFilter
  onFilterChange: (_filter: MediaFilter) => void
  onUpload: (_files: File[]) => void
}

const MediaLibraryToolbar = ({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onUpload,
}: Props) => {
  const { t } = useTranslation()

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  const handleFilterChange = (value: string) => {
    onFilterChange(value as MediaFilter)
  }

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    onUpload(Array.from(e.target.files ?? []))
    e.target.value = ""
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={handleSearchChange}
          placeholder={t("quizz:media.search")}
          className="focus:border-primary border-accent text-foreground h-10 w-full rounded-lg border-2 pr-3 pl-9 text-sm font-semibold focus:outline-none"
        />
      </div>

      <Select value={filter} onValueChange={handleFilterChange}>
        <SelectTrigger className="h-10 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTERS.map(({ value, labelKey }) => (
            <SelectItem key={value} value={value}>
              {t(labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="bg-primary flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white hover:brightness-[1.05] active:brightness-[0.95]">
        <Upload className="size-4" />
        {t("quizz:media.upload")}
        <input
          type="file"
          multiple
          accept={UPLOAD_ACCEPT}
          className="hidden"
          onChange={handleUpload}
        />
      </label>
    </div>
  )
}

export default MediaLibraryToolbar
