# Obsidian Gallery
![GitHub release)](https://img.shields.io/github/v/release/TomNCatz/obsidian-gallery)
![GitHub all releases](https://img.shields.io/github/downloads/TomNCatz/obsidian-gallery/total)

- Main Gallery to tag / filter / add notes to images.
- Display blocks to embed images inside notes
- Display block to an image information

#### Example:

##### Main Gallery
![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_main_gallery_1.gif)

##### Main Gallery Filtering

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_main_gallery_2.gif)

##### Display blocks

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_Display_Block.gif)

##### Display Image Info block

![](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/Example_Info_Block.gif)

##### Old example
![example_1](https://raw.githubusercontent.com/TomNCatz/obsidian-gallery/main/images/example_1.png) 

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

## Release Notes:

### v0.6.0
- Updated supporting libraries to modern equivilents
- Minor visual changes pulled in from other contributers
- mobile version cannot display collor pallet in this version

