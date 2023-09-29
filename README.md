# Tagged Gallery
![GitHub release)](https://img.shields.io/github/v/release/TomNCatz/obsidian-gallery)
![GitHub all releases](https://img.shields.io/github/downloads/TomNCatz/obsidian-gallery/total)

- Main Gallery to tag / filter / add notes to images.
- Display blocks to embed images inside notes
- Display block to an image information

## Examples:

### Main Gallery
![](docs/images/Example_main_gallery.gif)

### [Display blocks](docs/READEME_DisplayBlocks.md)
![](docs/images/Example_Display_Block.gif)

### [Meta Files and Templates](docs/README_MetaFiles.md)
![](docs/images/MetaFile.png)

### [Context Menu](docs/README_ContextMenu.md)
![](docs/images/ContextMenu.png)

### Settings:
![](docs/images/Gallery_Settings.png)

## [Tenative Roadmap](docs/README_Roadmap.md)

# Release Notes
## 1.1.5
 - Caches were not getting generated if there was any delay in app start, moved most startup into a bootstrap process
 - Globalization work should be done, now I just need to figure out how to translate into a dozen or so languages so it's actually useful

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

This is a continuation of developement from Darakah's obsidian-gallery, found here https://github.com/Darakah/obsidian-gallery
