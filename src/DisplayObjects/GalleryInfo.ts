import { type FrontMatterCache, TFile, getAllTags, WorkspaceLeaf } from "obsidian"
import type GalleryTagsPlugin from "../main"
import { SuggestionDropdown } from "./SuggestionDropdown"
import { getSearch } from "../utils"


export class GalleryInfo
{
	plugin: GalleryTagsPlugin
	doc: HTMLElement
	parent: HTMLElement
	imgFile: TFile
	imgInfo: TFile
	dimensions: HTMLVideoElement
	width: number
	height: number
    tagList: string[]
    colorList: string[]
    isVideo: boolean
    imgLinks: Array<{path : string, name: string}>
    infoLinks: Array<{path : string, name: string}>
    frontmatter: FrontMatterCache
    infoList: string[]

	constructor(parent: HTMLDivElement, doc: HTMLElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.doc = doc
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
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.imgFile.basename;
		}

		if(!this.infoList.contains("path"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Path";
			const imgLink = current.createDiv({ cls: 'gallery-info-section-value' }).createEl("a", { cls: 'internal-link' }); 
			imgLink.dataset.href = this.imgFile.path;
			imgLink.textContent = this.imgFile.path;
		}

		if(!this.infoList.contains("extension"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Extension";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.imgFile.extension;
		}

		if(!this.infoList.contains("size"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Size";
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = (this.imgFile.stat.size / 1000000).toPrecision(3) + " Mb";
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
			current.createDiv({ cls: 'gallery-info-section-value' }).textContent = new Date(this.imgFile.stat.ctime).toDateString();
		}

		if(!this.infoList.contains("imagetags"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Image Tags";
			currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
			
			if(this.tagList != null)
			{
				for(let i = 0; i < this.tagList.length; i++)
				{
					const pill = currentVal.createDiv("gallery-info-section-pill");	
					pill.style.backgroundColor = this.plugin.accentColorDark+"44";
					const currentTag = pill.createSpan("multi-select-pill-content")
					currentTag.textContent = this.tagList[i];
					currentTag.addEventListener("click", 
					async (s) =>{
						getSearch("tag:"+this.tagList[i].replace("#",""), this.plugin.app)
					});
					const removal = pill.createDiv("multi-select-pill-remove-button")
					removal.createSpan().textContent = "X";
					removal.addEventListener("click", 
					async (s) =>{
						await this.plugin.app.fileManager.processFrontMatter(this.imgInfo, frontmatter => {
							let tags = frontmatter.tags;
							if (!Array.isArray(tags)) 
							{ 
								tags = [tags]; 
							}
		
							tags.remove(this.tagList[i]);
							frontmatter.tags = tags;
							this.tagList.remove(this.tagList[i])
							this.updateDisplay();
							});
					});
				}
			}
			const newTagEl = currentVal.createEl("input", {cls: "new-tag-input"});
			newTagEl.name = "new-tag";
			newTagEl.placeholder = "New Tag";
			const suggetions = new SuggestionDropdown(newTagEl, () =>{
				const files = this.plugin.app.vault.getMarkdownFiles();
				const allTags: string[] = []
				for(let i = 0; i < files.length; i++)
				{
					const tags = getAllTags(this.plugin.app.metadataCache.getFileCache(files[i]));
					for(let k = 0; k < tags.length; k++)
					{
						if(!allTags.contains(tags[k]))
						{
							allTags.push(tags[k])
						}
					}
				}
				return allTags
			},
			async(s) =>{
				const tag = s.trim();
				if(tag === '')
				{
					return;
				}
				await this.plugin.app.fileManager.processFrontMatter(this.imgInfo, (frontmatter) => {
					let tags = frontmatter.tags ?? []
					if (!Array.isArray(tags)) 
					{ 
						tags = [tags]; 
					}

					if(tags.contains(tag))
					{
						return;
					}

					tags.push(tag);
					frontmatter.tags = tags;
					this.tagList.push(tag)
					this.updateDisplay();

					(document.querySelector("input[name='new-tag']") as HTMLInputElement).focus();
					});
			});
			suggetions.ignoreList = this.tagList;
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
					link.dataset.href = this.imgLinks[i].path;
					link.textContent = this.imgLinks[i].name;
				}
			}	
		}

		if(this.infoLinks.length > 0 && !this.infoList.contains("infolinks"))
		{
			current = block.createDiv({ cls: 'gallery-info-section' });
			current.createSpan({ cls: 'gallery-info-section-label' }).textContent = "Info Links";
			currentVal = current.createDiv({ cls: 'gallery-info-section-value' });
			if(this.infoLinks != null)
			{
				for(let i = 0; i < this.infoLinks.length; i++)
				{
					const link = currentVal.createEl("li",{ cls: 'img-info-link' }).createEl("a", { cls: 'internal-link' });
					link.dataset.href = this.infoLinks[i].path;
					link.textContent = this.infoLinks[i].name;
				}
			}	
		}

		if(!this.infoList.contains("colorpalette") && this.colorList.length > 0)
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
			if(!this.infoList.contains(yaml.toLocaleLowerCase()) && yaml !="position")
			{
				current = block.createDiv({ cls: 'gallery-info-section' });
				current.createSpan({ cls: 'gallery-info-section-label' }).textContent = yaml;
				current.createDiv({ cls: 'gallery-info-section-value' }).textContent = this.frontmatter[yaml];
			}
		}

		// Side panel links don't work normally, so this on click helps with that
		const docLinks = this.doc.querySelectorAll('a.internal-link');
		for (let i = 0; i < docLinks.length; i++) 
		{
			const docLink = docLinks[i] as HTMLElement;
			const href:string = docLink?.dataset?.href;
			if(href !== "")
			{
				const file = this.plugin.app.vault.getAbstractFileByPath(href);
				
				docLink.addEventListener('click', async (e) =>
				{
					if (file instanceof TFile)
					{
						this.plugin.app.workspace.getLeaf(false).openFile(file);
					}
				});
			}
		}
	}
}