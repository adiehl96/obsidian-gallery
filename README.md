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
## 1.5.5
 - Switching from vault.rename to fileManager.renameFile as suggested by chat
 - Fixing a bug that caused the app to hang if you closed and reopened the vault with the gallery window already open
 - Fixed a bug where you could delete an image but it would still show in searches

## 1.5.4
 - Fixing more bugs with middle and context click
 - Fixing bug with leaving the sidebar open and reloading
 - gallery resumes state more correctly
 - partial support for remote media(only images so far and they don't show in the gallery yet)

## 1.5.3
Fixing a bug I didn't test propperly before releasing, sorry about that

## 1.5.2
 - Assumes paging is wants an MD file unless there is an extension
 - Middle click to open meta file in new window

## 1.5.1
 - Context menu item to copy media to clipboard
 - Partial support for a mobile share menu item on devices that support it (newest versions of android don't and I haven't figured that out yet)
 - Better handling of internal links in sidebar
 - Paging info item added for image sequences

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


This is a continuation of developement from Darakah's obsidian-gallery, found here https://github.com/Darakah/obsidian-gallery
