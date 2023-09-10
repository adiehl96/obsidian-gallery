# Tagged Gallery
![GitHub release)](https://img.shields.io/github/v/release/TomNCatz/obsidian-gallery)
![GitHub all releases](https://img.shields.io/github/downloads/TomNCatz/obsidian-gallery/total)

- Main Gallery to tag / filter / add notes to images.
- Display blocks to embed images inside notes
- Display block to an image information

## Examples:

### Main Gallery
![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/docs/images/Example_main_gallery.gif)

### [Display blocks](docs/READEME_DisplayBlocks.md)

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/docs/images/Example_Display_Block.gif)

### Display Image Info block

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/docs/images/Example_Info_Block.gif)

## Settings:

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/docs/images/Gallery_Settings.png)


# Release Notes
## 0.8.1
 - Added button to copy current main gallery filter in a format that can be pasted in a note to generate a block gallery
 - Added another button to paste the same information back in as a filter to use in the gallery
 - Gallery blocks now support match case setting
 - Better handling for dots in the image file name
 - Gallery view optimizations
 - Auto resizing gallery views when the window resizes
 - removed old version specific codemirror dependencies

## v0.7.2
 - New setting to open filter by default in gallery
 - Can now choose if tags should match case in filter
 - slider added to filter that changes with size of image display
 - Better filter display on mobile
 - Settings now use fuzzy search to better facilitate selection
 - several updates to better comply with modern standards

### Fixed
 - gh#1 Meta file overwritten by sidebar

## v0.7.1
 - Fixing critical bug with meta file templates
 - Improves display of gallery filter on mobile
 - Image info blocks now try to resolve the image if the path has changed, and provides some info if it fails

## v0.7.0
- Total image count now only count file the gallery thinks it can display in the first place
- More large gallery optimization
- Added a setting for default hidden info
- Added the option to set your own template file for the meta files