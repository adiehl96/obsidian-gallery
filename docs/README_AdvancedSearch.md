Build a complex filter
---
path: path to search in (strict)
name: file name criteria (strict)
regex: custom search regex ({PATH} and {NAME} will be relaced with the path and name fields respectively)
tags: search for tags
<front matter field>: search a custom frontmatter field (for example "Palette:000000" to search for images with black in them)

Tag and frontmatter fields can also use these modifiers in front of a tag
---
!tag Strictly require this tag to be on the image
-tag Strictly exclude images that include this tag
^tag match case on this tag`,