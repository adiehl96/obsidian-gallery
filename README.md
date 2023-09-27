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

### [Meta Files and Templates](docs/READEME_MetaFiles.md)

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/docs/images/MetaFile.png)

## Settings:

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/docs/images/Gallery_Settings.png)


# Release Notes
## 1.1.4
 - GH#16 Changed how pathing and caching are handled while trying to account for multilingual file paths
 - Some other small cleanup

## 1.1.3
 - GH#16 sometimes if your info block path was wrong in just the right way it would break all the other links in the file while trying to fix the path. Now it just suggests the path it thinks you should use instead of trying to change it automagically
 - Swapped out some text buttons for icon buttons
 - Adding an option to rename image files and update their path in the meta file(if they have one)

## 1.1.2
 - Fix for bug where spaces in the file path would make the right click images anywhere functionality not function
 - Fixing all(I think) links in the side panel
 - Fixing bug where removing a tag didn't always work
 - Started adding globalization system for eventual localization(I'm not a linguist, so that second part may take a while)
 - New right click option for removing a tag from selected images
 - Tag suggestions now use cached tags, so should be faster
 - Some under the hood changes to improve security and maintainability

## 1.1.1
 - GH#14 Hidden info is now a list of checkboxes for better user experience
 - adding a section for backlinks to the meta file
 - Right click image anywhere to open meta file in leaf
 - fixed some other bugs one to do with indexing

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

This is a continuation of developement from Darakah's obsidian-gallery, found here https://github.com/Darakah/obsidian-gallery
