import type { ImageGrid } from "./ImageGrid";
import type GalleryTagsPlugin from "../main";
import { getImgInfo, offScreenPartial } from "../utils";
import { Platform, TFile } from "obsidian";
import type { GalleryInfoView } from "../view";
import { FuzzyTags } from "./FuzzySuggestions";

export class ImageMenu
{
	#plugin: GalleryTagsPlugin
	#imageGrid:ImageGrid
	#infoView:GalleryInfoView
	#self: HTMLDivElement
	#options: HTMLDivElement
	#selected: HTMLDivElement
	#targets:(HTMLVideoElement|HTMLImageElement)[]

	constructor(posX:number, posY:number, targets:(HTMLVideoElement|HTMLImageElement)[], imageGrid:ImageGrid, plugin: GalleryTagsPlugin, infoView:GalleryInfoView = null)
	{
		this.#plugin = plugin;
		this.#imageGrid = imageGrid;
		this.#infoView = infoView;
		this.#targets = targets;
		this.#self = createDiv({cls: "suggestion-container"})
		this.#self.focus();
		this.#options = this.#self.createDiv("#suggestions-scroll");
		this.#options.style.maxHeight = 300+"px";
		this.#options.style.overflowY = "auto";

		this.#self.addEventListener("mouseleave", (e) => {
			this.#cleanUp();
		});

		const items:string[] = [];

		if(this.#targets.length == 0)
		{
			if(!Platform.isDesktopApp)
			{
				items.push(this.#imageGrid.selectMode ? "End Selection" : "Start Selection");
			}
			items.push("Select all");
		}
		else
		{
			if(this.#targets.length == 1)
			{
				const info = this.#options.createDiv({cls: "suggestion-item"});
				info.innerText = '"'+this.#imageGrid.imgResources[this.#targets[0].src]+'" selected';
				items.push("Open image file");
				items.push("Open meta file");
			}

			if(this.#targets.length > 1)
			{
				const info = this.#options.createDiv({cls: "suggestion-item"});
				info.innerText = this.#targets.length+" selected";
				items.push("Clear selection");
			}

			if(!Platform.isDesktopApp)
			{
				items.push(this.#imageGrid.selectMode ? "End Selection" : "Start Selection");
			}
			items.push("Select all");

			items.push("Add tag");
			// items.push("Remove tag");
			// items.push("Move images");
			// items.push("Move meta");
			// items.push("Delete meta");
			// items.push("Delete both");
			// items.push("Rename both");
		}

		for (let i = 0; i < items.length; i++) 
		{
			const item = this.#options.createDiv({cls: "suggestion-item"});
			item.textContent = items[i];
			item.addEventListener("mouseover", (e) => {
				this.#select(item)
			});
			item.addEventListener("mousedown", () => {
				this.#submit();
			})
		}

		this.#self.addEventListener("blur", () => {this.#cleanUp()});

		this.#show(posX,posY);
	}

	#select(item: HTMLDivElement)
	{
		if(this.#selected)
		{
			this.#selected.removeClass("is-selected");
		}

		this.#selected = item;

		if(item == null)
		{
			return;
		}

		item.addClass("is-selected");
	}

	#submit()
	{
		let result:string = "";
		if(this.#selected)
		{
			result = this.#selected.textContent;
		}

		this.#cleanUp();

		switch(result)
		{
			case "Open image file": this.#resultOpenImage(); break;
			case "Open meta file": this.#resultOpenMeta(); break;
			case "Start Selection": this.#imageGrid.selectMode = true; break;
			case "End Selection": this.#imageGrid.selectMode = false; break;
			case "Select all": this.#imageGrid.selectAll(); break;
			case "Clear selection": this.#imageGrid.clearSelection(); break;
			case "Add tag": this.#resultAddTag(); break;
		}
	}

	#resultOpenImage()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		const file = this.#plugin.app.vault.getAbstractFileByPath(this.#imageGrid.imgResources[this.#targets[0].src])
		if (file instanceof TFile)
		{
			this.#plugin.app.workspace.getLeaf(false).openFile(file)
		}
	}

	async #resultOpenMeta()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		const infoFile = await getImgInfo(this.#imageGrid.imgResources[this.#targets[0].src],
			this.#plugin.app.vault,
			this.#plugin.app.metadataCache,
			this.#plugin,
			true);
		if (infoFile instanceof TFile)
		{
			this.#plugin.app.workspace.getLeaf(false).openFile(infoFile)
		}
	}

	#resultAddTag()
	{
		const fuzzyTags = new FuzzyTags(this.#plugin.app)
		fuzzyTags.onSelection = async (s) =>{
			const tag = s.trim();
			if(tag === '')
			{
				return;
			}
			for (let i = 0; i < this.#targets.length; i++) 
			{
				const infoFile = await getImgInfo(this.#imageGrid.imgResources[this.#targets[i].src],
					this.#plugin.app.vault,
					this.#plugin.app.metadataCache,
					this.#plugin,
					true);
				this.#plugin.app.fileManager.processFrontMatter(infoFile, frontmatter => {
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
					});
			}
		}

		fuzzyTags.open()
	}

	#show(posX:number,posY:number)
	{
		activeDocument.body.appendChild(this.#self);
		
		this.#self.style.left = (posX-4)+"px";
		this.#self.style.top = (posY-4)+"px";

		if(offScreenPartial(this.#self))
		{
			const box = this.#self.getBoundingClientRect();
			this.#self.style.left = (posX-box.width+4)+"px";
			this.#self.style.top = (posY-box.height+4)+"px";
		}
	}

	#cleanUp()
	{
		this.#select(null);

		if(this.#self)
		{
			this.#self.remove();
		}
	}
}