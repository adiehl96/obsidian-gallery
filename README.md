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
## 1.1.0
NOTE: there is a new indexing system which should improve search performance, but it will need to run against all existing meta files once before it works properly. You will see it pop up the first time you open a gallery (though if you don't have a lot of meta files it might flash away before you notice) It is advised not to cancel this process and then use the gallery, but if you cancel it and close the gallery it should pick back up where it left off the next time you open it.
 - Context option to move selected image(and update their metadata)
 - GH#2 Attempts to pull tags out of images and store them in the meta data when the metadata file first created
 - Option to manually pull the metadata for the selected images
 - Fixed a bug with lazy loading
 - Confirmation popup before large file operations
 - Progress bar with cancel for large file operations
 - New indexing system to improve search performance
 - Fixed a mobile bug with context menu display

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
