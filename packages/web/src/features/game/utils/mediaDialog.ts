export const shouldCloseMediaDialog = (target: EventTarget | null): boolean => {
  const tag = (target as { tagName?: string } | null)?.tagName

  return tag !== "VIDEO" && tag !== "AUDIO"
}
