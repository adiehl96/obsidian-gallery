export interface GallerySettings
{
  imgDataFolder: string | null
  galleryLoadPath: string
  imgmetaTemplatePath: string | null
  width: number
  useMaxHeight: boolean
  maxHeight: number
  hiddenInfoTicker: Record<string, boolean>
  filterStartOpen: boolean
  skipMetadataOverwrite: boolean
}