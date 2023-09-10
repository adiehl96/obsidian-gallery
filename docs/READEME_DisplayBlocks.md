# Image display block Usage

## Example

````markdown
```gallery
path=Weekly
name=.*Calen
tags=art -cartoons
exclusive=false
imgWidth=400
divWidth=70
divAlign=left
reverseOrder=false
customList=5 10 2 4
type=grid
```
````

## path REQUIRED
	The path a folder in your vault that you want to display images from
## name 
	Part of the name of the files you want to display
## tags
	A set of tags seperated by spaces you want to use in your filter
	Put a minus in front of a tag to exclude it
## exclusive
	default=false
	Should the tags be used exclusively or inclusively? 
	If true, all tags must match for an image to display
	If false, any tag matching will include the image unless it has an excluded tag
## imgWidth
	default= assigned in settings
	Max width of the columns in pixels
## divWidth
	default=100
	Percentage of the whole available width to use for displaying the gallery
## divAlign
	default=left
	Alignment of the gallery area
## reverseOrder
	default=false
	Should image order be flipped
## customList
	Specify images to display from the filtered list by their order in the list
## type
	default=grid
	Type of gallery display to use. Can be grid or active-thumb
	active-thumb is a legacy feature that may not get as much support as other gallery features