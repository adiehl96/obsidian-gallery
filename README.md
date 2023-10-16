# Tagged Gallery
![GitHub release)](https://img.shields.io/github/v/release/TomNCatz/obsidian-gallery)
![GitHub all releases](https://img.shields.io/github/downloads/TomNCatz/obsidian-gallery/total)

- Main Gallery to tag / filter / add notes to images.
- Filter by frontmatter criteria and change the meta right in the side panel
- Display blocks to embed images inside notes
- Display block to an image information

## Examples:

### [Main Gallery](https://github.com/TomNCatz/obsidian-gallery/blob/main/docs/README_MainGallery.md)
![](docs/images/Example_main_gallery.gif)

### [Display blocks](https://github.com/TomNCatz/obsidian-gallery/blob/main/docs/README_DisplayBlocks.md)
![](docs/images/Example_Display_Block.gif)

### [Meta Files and Templates](https://github.com/TomNCatz/obsidian-gallery/blob/main/docs/README_MetaFiles.md)
![](docs/images/MetaFile.png)

### [Context Menu](https://github.com/TomNCatz/obsidian-gallery/blob/main/docs/README_ContextMenu.md)
![](docs/images/ContextMenu.png)

### Settings:
![](docs/images/Gallery_Settings.png)

## [Tenative Roadmap](https://github.com/TomNCatz/obsidian-gallery/blob/main/docs/README_Roadmap.md)

# Release Notes
## 1.5.0
NOTE: As of version 1.5.0 Gallery Blocks have switched from using '=' to using ':' this is for better parody with the advanced filter. Any gallery blocks in your vault will be broken until you update these signs. (info blocks are unaffected)
 - Fixed bug where somethings width scale would break and you couldn't resize it
 - Fixing a mobile specific bug for video files
 - Fixing some edge detection issues with menus
 - Plugin now attempts to reopen side panel to what was open on close
 - Advanced search option with a new regex override option and frontmatter filters
 - new modifier for match case ^
 - Enabled multi name search
 - Fixed regex for paths

## 1.4.0
 - Added system for saving and reusing filters
 - Added Setting to manage the saved filters
 - Added setting to pick a default filter to load when opening the main gallery
 - Added an option for the default filter to be the last filter you used in the main gallery
 - Gallery blocks have new argument filter that takes a saved filter name or LAST_USED and applies the filter before applying any other details in the block

## 1.3.0
 - Added both a setting and a menu to change search bar types
 - New search bar type Simple Filter, which only has ignore case tag searches as an option(and takes up less screen real estate)
 - Fixing some issues with pasting filters and unifying string validation
 NOTE: there was an issue with the settings update and will not adhere to the previous show or hide setting. Going to settings and switching to classic will be the equivilent of the old show on open setting.

## 1.2.1
 - Added info links for similarly named files in the same folder(this helps for if you want to make a preview image for a file type that isn't supported, like PSD files)
 - Fixing a bug where the side panel would not display properly if obsidian was closed with the gallery open
 - GH#17 Added a sort menu to the gallery and sorting options should be supported elsewhere too
 - Added toggle to switch side panel to source editing mode(since I haven't figured out a way to draw a markdown preview and edit it at the  - same time)
 - Learned an important detail about typescript under the hood that may have caused errors in some places under the wrong circumstances


This is a continuation of developement from Darakah's obsidian-gallery, found here https://github.com/Darakah/obsidian-gallery
