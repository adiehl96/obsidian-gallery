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
## 1.0.1 RC2
 - Fix for GH#4 images with extra file extensions in their title could be incorrectly detected as videos
 - Fix for suggestion text sometimes missing items due to unawaited async functionality
 - Hitting escape twice now exits the tag input field
 - Hitting left and right while in the new tag input field no longer changes image focus
 - Re-focuses the new tag input field when a tag has been submitted
 - Don't suggest tags already on image
 - Don't resize for small resize increases
 - GH#5 Don't redraw for resizes unless there is column shifting
 - GH#6 New optional setting for max image height
 - Fix for meta file not immediately being available for edit after initial creation

## 1.0.0 RC1
 - Fuzzy search auto completer field added to tag block
 - tag block has Xs to delete tags
 - Fixed refresh bug in main gallery view
 - some CICD work to make builds run smoother that was not smooth to set up

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