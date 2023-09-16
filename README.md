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
## 1.0.3 RC4
 - Shift click to select multiple images in a gallery view (highlights in accent color)
 - Context menu for gallery views that includes options to
	 - Select all
	 - Start tap selection(mobile only)
	 - Clear selection
	 - Open single image
	 - Open single meta file
	 - Add a tag to selected files
	 - Copy selected images links to clipboard
	 - Copy selected meta links to clipboard
	 - Delete selected meta files
	 - Delete selected images(and their meta files)
 - Added new option to gallery blocks to limit the block's height(and create a scroll bar if needed)

## 1.0.2 RC3
 - Added a license
 - GH#11 side panel links were not working, they should now
 - GH#7 Support for a randomized subset of filter by either tapping on the dice icon in the main gallery or adding field to the block galleries
 - attempting to retain scroll position on redraw of gallery
 - Relocate suggestions if they would be partially offscreen

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
