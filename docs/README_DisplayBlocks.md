# Image display block Usage

## Example

````markdown
```gallery
path=Weekly
name=.*Calen
tags=art -cartoons
exclusive=false
matchCase=true
imgWidth=400
imgHeight=400
divWidth=70
divAlign=left
divHeight=1400
reverseOrder=false
customList=5 10 2 4
type=grid
random=0
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
## matchCase
default=false
Should tags be required to match case of the filter
## imgWidth
default= assigned in settings
Max width of the columns in pixels
## imgHeight
default= assigned in settings(default setting is 0 so images use max height)
Max height of each image in a gallery. If set to zero image will aut size height for best fit.
## divWidth
default=100
Percentage of the whole available width to use for displaying the gallery
## divAlign
default=left
Alignment of the gallery area
## divHeight
default=0
Height of the display block in pixels. If less than 10 it switchs to automatically fit the size of the contents. If greater than 10 it limits the view area and creates a scroll area if needed to display all results
## reverseOrder
default=false
Should image order be flipped
## customList
Specify images to display from the filtered list by their order in the list(not compatible with randomization)
## random
Specify number of random images to display from the filtered list. If zero or greater than the number of results from the filter it is ignored
## type
default=grid
Type of gallery display to use. Can be grid or active-thumb
active-thumb is a legacy feature that may not get as much support as other gallery features