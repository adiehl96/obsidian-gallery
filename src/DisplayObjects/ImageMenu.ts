import type { ImageGrid } from "./ImageGrid";
import type GalleryTagsPlugin from "../main";
import { addEmbededTags, getImgInfo, offScreenPartial, preprocessUri } from "../utils";
import { Notice, Platform, TFile } from "obsidian";
import type { GalleryInfoView } from "../view";
import { FuzzyFolders, FuzzyTags } from "./FuzzySuggestions";
import { ConfirmModal } from "./ConfirmPopup";

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
		this.#options.style.maxHeight = 500+"px";
		this.#options.style.overflowY = "auto";

		this.#self.addEventListener("mouseleave", (e) => {
			this.#cleanUp();
		});

		if(this.#targets.length == 0)
		{
			const info = this.#options.createDiv({cls: "suggestion-item"});
			info.innerText = 'Nothing selected';

			this.#options.createDiv({cls: "suggestion-item-separator"});

			if(!Platform.isDesktopApp)
			{
				this.#createItem(this.#imageGrid.selectMode ? "End Selection" : "Start Selection");
			}
			this.#createItem("Select all");
		}
		else
		{
			if(this.#targets.length == 1)
			{
				const info = this.#options.createDiv({cls: "suggestion-item"});
				info.innerText = '"'+this.#imageGrid.imgResources[this.#targets[0].src]+'" selected';

				this.#options.createDiv({cls: "suggestion-item-separator"});

				this.#createItem("Open image file");
				this.#createItem("Open meta file");
			}

			if(this.#targets.length > 1)
			{
				const info = this.#options.createDiv({cls: "suggestion-item"});
				info.innerText = this.#targets.length+" selected";

				this.#options.createDiv({cls: "suggestion-item-separator"});

				this.#createItem("Clear selection");
			}

			if(!Platform.isDesktopApp)
			{
				this.#createItem(this.#imageGrid.selectMode ? "End Selection" : "Start Selection");
			}
			this.#createItem("Select all");
			
			this.#options.createDiv({cls: "suggestion-item-separator"});

			this.#createItem("Copy image links");
			this.#createItem("Copy meta links");
			
			this.#options.createDiv({cls: "suggestion-item-separator"});

			this.#createItem("Add tag");
			this.#createItem("Pull tags from file");
			// this.#createItem("Remove tag");
			this.#createItem("Move images");
			
			// if(this.#targets.length == 1)
			// {
			// 	this.#createItem("Rename");
			// }
			
			this.#options.createDiv({cls: "suggestion-item-separator"});

			this.#createItem("Delete image(and meta)");
			this.#createItem("Delete just meta");
		}

		this.#self.addEventListener("blur", () => {this.#cleanUp()});

		this.#show(posX,posY);
	}

	#createItem(text: string)
	{
		const item = this.#options.createDiv({cls: "suggestion-item"});
		item.textContent = text;
		item.addEventListener("mouseover", (e) => {
			this.#select(item)
		});
		item.addEventListener("mousedown", () => {
			this.#submit();
		})

		if(text.contains("Delete"))
		{
			item.style.color = "#cc2222";
		}
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

		if(this.#targets.length > 50)
		{
			const confirm = new ConfirmModal(this.#plugin.app, 
				`There are ${this.#targets.length} files selected for '${result}' are you sure?`,
				() => {this.#results(result);})
			confirm.open();
		}
		else
		{
			this.#results(result);
		}
	}

	#results(result: string)
	{
		switch(result)
		{
			case "Open image file": this.#resultOpenImage(); break;
			case "Open meta file": this.#resultOpenMeta(); break;
			case "Start Selection": this.#imageGrid.selectMode = true; break;
			case "End Selection": this.#imageGrid.selectMode = false; break;
			case "Select all": this.#imageGrid.selectAll(); break;
			case "Clear selection": this.#imageGrid.clearSelection(); break;
			case "Copy image links": this.#resultCopyImageLink(); break;
			case "Copy meta links": this.#resultCopyMetaLink(); break;
			case "Add tag": this.#resultAddTag(); break;
			case "Pull tags from file": this.#resultPullTags(); break;
			case "Remove tag":  break;
			case "Move images": this.#resultMoveImages(); break;
			case "Rename":  break;
			case "Delete image(and meta)": this.#resultDeleteImage(); break;
			case "Delete just meta": this.#resultDeleteMeta(); break;
			default: new Notice(`context options "${result}" is not accounted for`);
		}
	}

	#resultOpenImage()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		const source = this.#getSource(this.#targets[0]);
		const file = this.#plugin.app.vault.getAbstractFileByPath(this.#imageGrid.imgResources[source])
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

		const source = this.#getSource(this.#targets[0]);
		const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
			this.#plugin.app.vault,
			this.#plugin.app.metadataCache,
			this.#plugin,
			true);
		if (infoFile instanceof TFile)
		{
			this.#plugin.app.workspace.getLeaf(false).openFile(infoFile)
		}
	}

	async #resultCopyImageLink()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}
		
		let links = "";

		for (let i = 0; i < this.#targets.length; i++) 
		{
			const source = this.#getSource(this.#targets[i]);
			const file = this.#plugin.app.vault.getAbstractFileByPath(this.#imageGrid.imgResources[source])
			if(file instanceof TFile)
			{
				links += `![${file.basename}](${preprocessUri(file.path)})\n`
			}
		}

		await navigator.clipboard.writeText(links);

		new Notice("Links copied to clipboard");
	}

	async #resultCopyMetaLink()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}
		
		let links = "";

		for (let i = 0; i < this.#targets.length; i++) 
		{
			const source = this.#getSource(this.#targets[i]);
			const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
				this.#plugin.app.vault,
				this.#plugin.app.metadataCache,
				this.#plugin,
				true);
			if(infoFile)
			{
				links += `[${infoFile.basename}](${preprocessUri(infoFile.path)})\n`
			}
		}

		await navigator.clipboard.writeText(links);

		new Notice("Links copied to clipboard");
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
				const source = this.#getSource(this.#targets[i]);
				const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
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
			
			new Notice("Tag added to files");
		}

		fuzzyTags.open()
	}

	async #resultPullTags()
	{
		const promises: Promise<void>[] = []
		for (let i = 0; i < this.#targets.length; i++) 
		{
			const source = this.#getSource(this.#targets[i]);
			const file = this.#plugin.app.vault.getAbstractFileByPath(this.#imageGrid.imgResources[source])
			const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
				this.#plugin.app.vault,
				this.#plugin.app.metadataCache,
				this.#plugin,
				true);

			promises.push(addEmbededTags(file as TFile,infoFile, this.#plugin));
		}

		await Promise.all(promises);
		
		new Notice("Tags added to files");
	}

	#resultMoveImages()
	{
		const fuzzyFolders = new FuzzyFolders(this.#plugin.app)
        fuzzyFolders.onSelection = async (s) =>
		{
			for (let i = 0; i < this.#targets.length; i++) 
			{
				const source = this.#getSource(this.#targets[i]);
				const file = this.#plugin.app.vault.getAbstractFileByPath(this.#imageGrid.imgResources[source])
				const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
					this.#plugin.app.vault,
					this.#plugin.app.metadataCache,
					this.#plugin,
					false);
				if(file)
				{
					const oldPath = file.path
					const newPath = s+"/"+file.name
					// new Notice(newPath);
					await this.#plugin.app.vault.rename(file, newPath);

					if(infoFile)
					{
						// update the links in the meta file
						this.#plugin.app.vault.process(infoFile, (data) =>{
							data = data.replaceAll(oldPath, newPath);

							const oldUri = preprocessUri(oldPath)
							const newUri = preprocessUri(newPath)
							data = data.replaceAll(oldUri, newUri);

							return data;
						});
					}
				}
			}
	
			new Notice("Images moved");

			await new Promise(f => setTimeout(f, 100));
			await this.#imageGrid.updateData();
			await this.#imageGrid.updateDisplay();
		}

		fuzzyFolders.open()
	}

	async #resultDeleteMeta()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		for (let i = 0; i < this.#targets.length; i++) 
		{
			const source = this.#getSource(this.#targets[i]);
			const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
				this.#plugin.app.vault,
				this.#plugin.app.metadataCache,
				this.#plugin,
				false);
			if(infoFile)
			{
				this.#plugin.app.vault.delete(infoFile);
			}
		}
		
		new Notice("Meta deleted");
	}

	async #resultDeleteImage()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		for (let i = 0; i < this.#targets.length; i++) 
		{
			const source = this.#getSource(this.#targets[i]);
			const file = this.#plugin.app.vault.getAbstractFileByPath(this.#imageGrid.imgResources[source])
			const infoFile = await getImgInfo(this.#imageGrid.imgResources[source],
				this.#plugin.app.vault,
				this.#plugin.app.metadataCache,
				this.#plugin,
				false);
			if(file)
			{
				await this.#plugin.app.vault.delete(file);
			}
			if(infoFile)
			{
				this.#plugin.app.vault.delete(infoFile);
			}
		}

		new Notice("Images and meta deleted");

		await new Promise(f => setTimeout(f, 100));
		await this.#imageGrid.updateData();
		await this.#imageGrid.updateDisplay();
	}

	#getSource(target: (HTMLVideoElement | HTMLImageElement)) : string
	{
		if(target.dataset.src)
		{
			return target.dataset.src;
		}
		return target.src;
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