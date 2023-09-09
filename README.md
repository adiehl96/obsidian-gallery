# Obsidian Gallery
![GitHub release)](https://img.shields.io/github/v/release/TomNCatz/obsidian-gallery)
![GitHub all releases](https://img.shields.io/github/downloads/TomNCatz/obsidian-gallery/total)

- Main Gallery to tag / filter / add notes to images.
- Display blocks to embed images inside notes
- Display block to an image information

#### Examples:

##### Main Gallery
![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_main_gallery.gif)

##### Display blocks

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_Display_Block.gif)

##### Display Image Info block

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_Info_Block.gif)


## Usage:

### Image display block Usage
e.g. Input:

```
path=Weekly
name=.*Calen
imgWidth=400
divWidth=70
divAlign=left
reverseOrder=false
customList=5 10 2 4
```

Argument Info:
- **type**: specify display type. Possible values grid, active-thumb
- **path**: vault path to display images from. Regex expression
- **imgWidth**: image width in pixels
- **divWidth**: div container in %
- **divAlign**: div alignment. Possible values left, right
- **reverseOrder**: reverse the display order of images. Possible values true, false
- **customList**: specify image indexes to display in the passed order

## Settings:

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Gallery_Settings.png)


# Release Notes
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

## v0.6.2
- Tag filter support added to gallery block
- Tag filter support is more stable and consistent now
- added support for .gif and .webm support
- indicator in filter of how many files are being shown verses the total(this currently show all file types for the total, not just supported image file types, will fix later)
- some work done to improve handling of exceptionally large image collections(over 14000)
- moved the reverse sorting checkbox into the filter header so it can be changed on the fly
- cleaned up some packages that might have had vulnerabilities
- fixed issue with supporting multiple spaces in a file name
