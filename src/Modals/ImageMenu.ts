import type { ImageGrid } from "../DisplayObjects/ImageGrid";
import type GalleryTagsPlugin from "../main";
import { addEmbededTags, createMetaFile, getImageInfo, offScreenPartial, preprocessUri, validString } from "../utils";
import { Notice, Platform, TFile } from "obsidian";
import type { GalleryInfoView } from "../DisplayObjects/GalleryInfoView";
import { FuzzyFolders, FuzzyTags } from "./FuzzySearches";
import { ConfirmModal } from "./ConfirmPopup";
import { ProgressModal } from "./ProgressPopup";
import { loc } from '../Loc/Localizer'
import { SuggestionPopup } from "./SuggestionPopup";
import { MenuPopup } from "./MenuPopup";

enum Options
{
	Error = 0,
	OpenImageFile = 1,
	OpenMetaFile = 2,
	StartSelection = 3,
	EndSelection = 4,
	SelectAll = 5,
	ClearSelection = 6,
	CopyImageLinks = 7,
	CopyMetaLinks = 8,
	AddTag = 9,
	PullMetaFromFile = 10,
	RemoveTag = 11,
	MoveImages = 12,
	Rename = 13,
	DeleteImage = 14,
	DeleteMeta = 15
}

export class ImageMenu extends MenuPopup
{
	#plugin: GalleryTagsPlugin
	#imageGrid:ImageGrid
	#infoView:GalleryInfoView
	#targets:(HTMLVideoElement|HTMLImageElement)[]


	constructor(posX:number, posY:number, targets:(HTMLVideoElement|HTMLImageElement)[], imageGrid:ImageGrid, plugin: GalleryTagsPlugin, infoView:GalleryInfoView = null)
	{
		super(posX, posY, (result) => {this.#submit(result)});

		this.#plugin = plugin;
		this.#imageGrid = imageGrid;
		this.#infoView = infoView;
		this.#targets = targets;

		if(this.#targets.length == 0)
		{
			this.AddLabel(loc('IMAGE_MENU_NOTHING'));
			this.addSeparator();

			if( this.#imageGrid && !Platform.isDesktopApp)
			{
				this.#createItem(this.#imageGrid.selectMode ? Options.EndSelection : Options.StartSelection);
			}
			this.#createItem(Options.SelectAll);
		}
		else
		{
			if(this.#targets.length == 1)
			{
				this.AddLabel(loc('IMAGE_MENU_SINGLE',this.#plugin.getImgResources()[this.#targets[0].src]));
				this.addSeparator();

				this.#createItem(Options.OpenImageFile);
				this.#createItem(Options.OpenMetaFile);
			}

			if(this.#targets.length > 1)
			{
				this.AddLabel(loc('IMAGE_MENU_COUNT',this.#targets.length.toString()));
				this.addSeparator();
				

				this.#createItem(Options.ClearSelection);
			}

			if(this.#imageGrid && !Platform.isDesktopApp)
			{
				this.#createItem(this.#imageGrid.selectMode ? Options.EndSelection : Options.StartSelection);
			}
			if(this.#imageGrid)
			{
				this.#createItem(Options.SelectAll);
			}
			
			this.addSeparator();

			this.#createItem(Options.CopyImageLinks);
			this.#createItem(Options.CopyMetaLinks);
			
			this.addSeparator();

			this.#createItem(Options.AddTag);
			this.#createItem(Options.PullMetaFromFile);
			this.#createItem(Options.RemoveTag);
			this.#createItem(Options.MoveImages);
			
			if(this.#targets.length == 1)
			{
				this.#createItem(Options.Rename);
			}
			
			this.addSeparator();

			this.#createItem(Options.DeleteImage);
			this.#createItem(Options.DeleteMeta);
		}

		this.show(posX,posY);
	}

	#createItem(command: Options)
	{
		//@ts-ignore
		const label = loc("IMAGE_MENU_COMMAND_"+command);

		let color:string = null;
		if(Options[command].contains("Delete"))
		{
			color = "#cc2222";
		}

		this.addItem(label, Options[command], color);
	}

	#submit(responce:string)
	{
		const result = Options[responce as keyof typeof Options];
		if(this.#targets.length < 50 ||
			(result == Options.StartSelection ||
			result == Options.EndSelection ||
			result == Options.SelectAll ||
			result == Options.ClearSelection ||
			result == Options.CopyImageLinks))
		{
			this.#results(result);
			return;
		}

		//@ts-ignore
		const commandText = loc("IMAGE_MENU_COMMAND_"+result);
		const confirmText= loc('MASS_CONTEXT_CONFIRM', this.#targets.length.toString(), commandText);

		const confirm = new ConfirmModal(this.#plugin.app, 
			confirmText,
			() => {this.#results(result);})
		confirm.open();
	}

	#results(result: Options)
	{
		switch(result)
		{
			case Options.OpenImageFile: this.#resultOpenImage(); break;
			case Options.OpenMetaFile: this.#resultOpenMeta(); break;
			case Options.StartSelection: this.#imageGrid.selectMode = true; break;
			case Options.EndSelection: this.#imageGrid.selectMode = false; break;
			case Options.SelectAll: this.#imageGrid.selectAll(); break;
			case Options.ClearSelection: this.#imageGrid.clearSelection(); break;
			case Options.CopyImageLinks: this.#resultCopyImageLink(); break;
			case Options.CopyMetaLinks: this.#resultCopyMetaLink(); break;
			case Options.AddTag: this.#resultAddTag(); break;
			case Options.PullMetaFromFile: this.#resultPullTags(); break;
			case Options.RemoveTag: this.#resultRemoveTag(); break;
			case Options.MoveImages: this.#resultMoveImages(); break;
			case Options.Rename: this.#resultRenameImage(); break;
			case Options.DeleteImage: this.#resultDeleteImage(); break;
			case Options.DeleteMeta: this.#resultDeleteMeta(); break;
			default: 
				const error = loc('MENU_OPTION_FAULT', Options[result]);
				new Notice(error);
				console.error(error);
		}
	}

	#resultOpenImage()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		const source = this.#getSource(this.#targets[0]);
		const file = this.#plugin.app.vault.getAbstractFileByPath(this.#plugin.getImgResources()[source])
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
		const infoFile = await getImageInfo(this.#plugin.getImgResources()[source], true, this.#plugin);
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
			const file = this.#plugin.app.vault.getAbstractFileByPath(this.#plugin.getImgResources()[source])
			if(file instanceof TFile)
			{
				links += `![${file.basename}](${preprocessUri(file.path)})\n`
			}
		}

		await navigator.clipboard.writeText(links);

		new Notice(loc('COPIED_LINKS'));
	}

	async #resultCopyMetaLink()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}
		
		let links = "";

		let cancel = false;
		const progress = new ProgressModal(this.#plugin, this.#targets.length, ()=>{cancel = true;})
		progress.open();

		for (let i = 0; i < this.#targets.length; i++) 
		{
			if(cancel)
			{
				new Notice(loc('GENERIC_CANCELED'));
				return;
			}
			
			progress.updateProgress(i);

			const source = this.#getSource(this.#targets[i]);
			const infoFile = await getImageInfo(this.#plugin.getImgResources()[source], true, this.#plugin);
			if(infoFile)
			{
				links += `[${infoFile.basename}](${preprocessUri(infoFile.path)})\n`
			}
		}

		await navigator.clipboard.writeText(links);

		new Notice(loc('COPIED_LINKS'));
	}

	#resultAddTag()
	{
		const fuzzyTags = new FuzzyTags(this.#plugin)
		fuzzyTags.onSelection = async (s) =>{
			const tag = s.trim();
			if(!validString(tag))
			{
				return;
			}

			let cancel = false;
			const progress = new ProgressModal(this.#plugin, this.#targets.length, ()=>{cancel = true;})
			progress.open();
	
			for (let i = 0; i < this.#targets.length; i++) 
			{
				if(cancel)
				{
					new Notice(loc('GENERIC_CANCELED'));
					return;
				}
				
				progress.updateProgress(i);
	
				const source = this.#getSource(this.#targets[i]);
				const infoFile = await getImageInfo(this.#plugin.getImgResources()[source], true, this.#plugin);
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
			
			new Notice(loc('ADDED_TAG'));
		}

		fuzzyTags.open()
	}

	async #resultPullTags()
	{
		const promises: Promise<any>[] = []

		let cancel = false;
		const progress = new ProgressModal(this.#plugin, this.#targets.length+1, ()=>{cancel = true;})
		progress.open();

		for (let i = 0; i < this.#targets.length; i++) 
		{
			if(cancel)
			{
				new Notice(loc('GENERIC_CANCELED'));
				return;
			}
			progress.updateProgress(i);

			const source = this.#getSource(this.#targets[i]);
			const file = this.#plugin.app.vault.getAbstractFileByPath(this.#plugin.getImgResources()[source])
			let infoFile = await getImageInfo(this.#plugin.getImgResources()[source], false, this.#plugin);

			if(!(file instanceof TFile))
			{
				continue;
			}

			if(infoFile)
			{
				this.#plugin.getMetaResources()[file.path] = infoFile.path
				promises.push(addEmbededTags(file,infoFile, this.#plugin));
			}
			else
			{
				infoFile = await createMetaFile(this.#plugin.getImgResources()[source], this.#plugin);
				
				if(infoFile)
				{
					this.#plugin.getMetaResources()[file.path] = infoFile.path;
				}
			}
		}

		await Promise.all(promises);
		progress.updateProgress(this.#targets.length);
		
		new Notice(loc('ADDED_TAG'));
	}
	

	#resultRemoveTag()
	{
		const fuzzyTags = new FuzzyTags(this.#plugin)
		fuzzyTags.onSelection = async (s) =>{
			const tag = s.trim();
			if(!validString(tag))
			{
				return;
			}

			let cancel = false;
			const progress = new ProgressModal(this.#plugin, this.#targets.length, ()=>{cancel = true;})
			progress.open();
	
			for (let i = 0; i < this.#targets.length; i++) 
			{
				if(cancel)
				{
					new Notice(loc('GENERIC_CANCELED'));
					return;
				}
				
				progress.updateProgress(i);
	
				const source = this.#getSource(this.#targets[i]);
				const infoFile = await getImageInfo(this.#plugin.getImgResources()[source], true, this.#plugin);
				this.#plugin.app.fileManager.processFrontMatter(infoFile, frontmatter => {
					let tags = frontmatter.tags ?? []
					if (!Array.isArray(tags)) 
					{ 
						tags = [tags]; 
					}

					let change = false;
					const tagNoHash = tag.replace('#','');
					const tagAddHash = '#'+tag;

					if(tags.contains(tagNoHash))
					{
						tags.remove(tagNoHash);
						change = true;
					}
					if(tags.contains(tag))
					{
						tags.remove(tag);
						change = true;
					}
					if(tags.contains(tagAddHash))
					{
						tags.remove(tagAddHash);
						change = true;
					}

					if(change)
					{
						frontmatter.tags = tags;
					}
				});
			}
			
			new Notice(loc('REMOVED_TAG'));
		}

		fuzzyTags.open()
	}

	#resultMoveImages()
	{
		const fuzzyFolders = new FuzzyFolders(this.#plugin.app)
        fuzzyFolders.onSelection = async (s) =>
		{
			let cancel = false;
			const progress = new ProgressModal(this.#plugin, this.#targets.length, ()=>{cancel = true;})
			progress.open();

			for (let i = 0; i < this.#targets.length; i++) 
			{
				if(cancel)
				{
					new Notice(loc('GENERIC_CANCELED'));
					return;
				}
				
				progress.updateProgress(i);

				const source = this.#getSource(this.#targets[i]);
				const file = this.#plugin.app.vault.getAbstractFileByPath(this.#plugin.getImgResources()[source])
				if(file)
				{
					const newPath = s+"/"+file.name
					delete this.#plugin.getImgResources()[source];
					await this.#plugin.app.vault.rename(file, newPath);
				}
			}
	
			new Notice(loc('MOVED_IMAGE'));

			await this.#refreshImageGrid();
		}

		fuzzyFolders.open()
	}

	#resultRenameImage()
	{
		if(this.#targets.length != 1)
		{
			return;
		}

		const original: string = this.#plugin.getImgResources()[this.#targets[0].src];
		const suggesion = new SuggestionPopup(this.#plugin.app,
			loc("PROMPT_FOR_NEW_NAME"),
			original,
			() =>
			{
				const files = this.#plugin.app.vault.getAllLoadedFiles()
				const filtered = files.filter((f) => (f instanceof TFile))
				return filtered.map((f) => f.path)
			},
        	async (newName) =>
			{
				const file = this.#plugin.app.vault.getAbstractFileByPath(original) as TFile;
				if(!newName.contains(file.extension))
				{
					newName += file.extension;
				}

				const conflict = this.#plugin.app.vault.getAbstractFileByPath(newName);
				if(conflict)
				{
					new Notice(loc('CONFLICT_NOTICE_PATH', newName));
					return;
				}

				if(file)
				{
					delete this.#plugin.getImgResources()[this.#targets[0].src];
					await this.#plugin.app.vault.rename(file, newName);
				}
				new Notice(loc('MOVED_IMAGE'));
	
				await this.#refreshImageGrid();
			});
		suggesion.open();
	}

	async #resultDeleteMeta()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		let cancel = false;
		const progress = new ProgressModal(this.#plugin, this.#targets.length, ()=>{cancel = true;})
		progress.open();

		for (let i = 0; i < this.#targets.length; i++) 
		{
			if(cancel)
			{
				new Notice(loc('GENERIC_CANCELED'));
				return;
			}
			
			progress.updateProgress(i);

			const source = this.#getSource(this.#targets[i]);
			const infoFile = await getImageInfo(this.#plugin.getImgResources()[source], false, this.#plugin);
			if(infoFile)
			{
				await this.#plugin.app.vault.delete(infoFile);
			}
		}
		
		new Notice(loc('DELETED_META'));
	}

	async #resultDeleteImage()
	{
		if(this.#infoView)
		{
			this.#infoView.clear()
		}

		let cancel = false;
		const progress = new ProgressModal(this.#plugin, this.#targets.length, ()=>{cancel = true;})
		progress.open();

		for (let i = 0; i < this.#targets.length; i++) 
		{
			if(cancel)
			{
				new Notice(loc('GENERIC_CANCELED'));
				return;
			}
			
			progress.updateProgress(i);

			const source = this.#getSource(this.#targets[i]);
			const file = this.#plugin.app.vault.getAbstractFileByPath(this.#plugin.getImgResources()[source])
			const infoFile = await getImageInfo(this.#plugin.getImgResources()[source], false, this.#plugin);
			if(file)
			{
				await this.#plugin.app.vault.delete(file);
			}
			if(infoFile)
			{
				this.#plugin.app.vault.delete(infoFile);
			}
		}

		new Notice(loc('DELETED_IMAGE'));
		await this.#refreshImageGrid();
	}

	async #refreshImageGrid()
	{
		if(!this.#imageGrid)
		{
			return;
		}

        // TODO: I hate every single one of these, cause it means I'm waiting on something and I don't know what
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
}