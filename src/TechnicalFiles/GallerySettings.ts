import type { FilterType } from "./FilterType"

export interface GallerySettings
{
  imgDataFolder: string | null
  galleryLoadPath: string
  imgmetaTemplatePath: string | null
  hiddenInfoTicker: Record<string, boolean>
  uniqueMobileSettings: boolean
  desktop: PlatformSettings
  mobile: PlatformSettings
  skipMetadataOverwrite: boolean
}

export interface PlatformSettings
{
  filterType: FilterType
  rightClickInfo: boolean
  rightClickMenu: boolean
  width: number
  useMaxHeight: boolean
  maxHeight: number
}