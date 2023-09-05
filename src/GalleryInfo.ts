import { Notice, type FrontMatterCache } from "obsidian"
import type GalleryTagsPlugin from "./main"

export class GalleryInfo
{
	plugin: GalleryTagsPlugin
	parent: HTMLElement
    name: string
    path: string
    extension: string
    size: number
	dimensions: HTMLVideoElement
	width: number
	height: number
    date: Date
    tagList: string[]
    colorList: string[]
    isVideo: boolean
    imgLinks: Array<{path : string, name: string}>
    frontmatter: FrontMatterCache
    infoList: string[]

	constructor(parent: HTMLDivElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.parent = parent;
	}

	updateDisplay()
	{
		this.parent.replaceChildren();
		const block = this.parent.createDiv({ cls: 'gallery-info-container' });
		let current: HTMLDivElement;
		let currentVal: HTMLDivElement;

		if(!this.infoList.contains("name"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Name";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.name;
		}

		if(!this.infoList.contains("path"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Path";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.path;
		}

		if(!this.infoList.contains("extension"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Extension";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.extension;
		}

		if(!this.infoList.contains("size"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Size";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.size.toPrecision(3) + " Mb";
		}

		if(!this.infoList.contains("dimensions"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Dimensions";
			const dimensionsEl = current.createDiv({ cls: 'gallery-info-section-value' });
			dimensionsEl.textContent =  this.width +"x"+this.height+" px";
			if(this.dimensions)
			{
				this.dimensions.addEventListener("loadedmetadata", (e) =>{
					dimensionsEl.textContent = this.dimensions.videoWidth+"x"+this.dimensions.videoHeight+" px";
				});
			}
		}

		if(!this.infoList.contains("date"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Date";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.date.toDateString();
		}

		if(!this.infoList.contains("image-tags"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Image Tags";
			currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
			if(this.tagList != null)
			{
				for(let i = 0; i < this.tagList.length; i++)
				{
					const currentTag = currentVal.createEl("a", { cls: 'tag' })
					currentTag.target = "_blank";
					currentTag.rel = "noopener";
					currentTag.href = this.tagList[i];
					currentTag.textContent = this.tagList[i];
				}
			}
			const newTagEl = currentVal.createEl("input");
			newTagEl.placeholder = "New Tag";
			newTagEl.addEventListener("input", (e)=>{new Notice("Input")}) // fired when text is altered
			newTagEl.addEventListener("change", (e)=>{new Notice("Change")}) // fired when user hits return
		}

		if(!this.infoList.contains("backlinks"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Backlinks";
			currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
			if(this.imgLinks != null)
			{
				for(let i = 0; i < this.imgLinks.length; i++)
				{
					const link = currentVal.createEl("li",{ cls: 'img-info-link' }).createEl("a", { cls: 'internal-link' });
					link.href = this.imgLinks[i].path;
					link.textContent = this.imgLinks[i].name;
				}
			}	
		}

		if(!this.infoList.contains("color-palette") && this.colorList.length > 0)
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Color Palette";
			currentVal = current.createDiv({ cls: 'gallery-info-section-value' })
			
			if(this.colorList != null)
			{
				for(let i = 0; i < this.colorList.length; i++)
				{
					const currentColor = currentVal.createDiv({ cls: 'gallery-info-color' })
					currentColor.ariaLabel = this.colorList[i];
					currentColor.style.backgroundColor = this.colorList[i];
				}
			}
		}

		for(const yaml in this.frontmatter)
		{
			if(!this.infoList.contains(yaml.toLocaleLowerCase()))
			{
				current = block.createDiv({ cls: 'gallery-info-section' });
				current.createSpan({ cls: 'gallery-info-section-label' }).textContent = yaml;
				current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.frontmatter[yaml];
			}
		}
	}
}