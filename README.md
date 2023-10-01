# Tagged Gallery
![GitHub release)](https://img.shields.io/github/v/release/TomNCatz/obsidian-gallery)
![GitHub all releases](https://img.shields.io/github/downloads/TomNCatz/obsidian-gallery/total)

- Main Gallery to tag / filter / add notes to images.
- Display blocks to embed images inside notes
- Display block to an image information

## Examples:

### Main Gallery
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

## 1.2.0
 - Fixing a bug in detecting new images added while while open
 - Fixed an issue where you could select or try to preview nothing
 - Fixing critical mobile bug that prevented the gallery working with new caching techniques
 - Got right click menu working anywhere and added setting to turn it off
 - Moved several settings into a platform specific set of options
 - I spent an hour trying to write handling for an edge case where in large vaults a combination of the sync plugin and the dataview plugin would cause a loading fault for THIS plugin, and now I can't get it to happen to test it so this code doesn't break anything, but also might not fix anything.

## 1.1.5
 - Caches were not getting generated if there was any delay in app start, moved most startup into a bootstrap process
 - Globalization work should be done, now I just need to figure out how to translate into a dozen or so languages so it's actually useful

This is a continuation of developement from Darakah's obsidian-gallery, found here https://github.com/Darakah/obsidian-gallery
