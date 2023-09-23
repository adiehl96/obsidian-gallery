import { Keymap, Notice, TFile, normalizePath, type UserEvent, getAllTags, TFolder } from "obsidian"
import type GalleryTagsPlugin from "../main"
import type { ImageResources } from '../utils'
import
 {
    createMetaFile,
	getimageLink,
	setLazyLoading,
	updateFocus
} from '../utils'
import 
{
	EXTENSIONS,
	GALLERY_LOADING_IMAGE,
	VIDEO_REGEX
} from '../TechnicalFiles/Constants'
import type { GalleryInfoView } from "./GalleryInfoView"
import { ImageMenu } from "../Modals/ImageMenu"
import { ProgressModal } from "../Modals/ProgressPopup"
import { loc } from '../Loc/Localizer'

export class ImageGrid
{
	plugin: GalleryTagsPlugin
	parent: HTMLElement
	columnContainer: HTMLElement
	path: string = ""
	name: string = ""
	tag: string = ""
	matchCase: boolean = true
	exclusive: boolean = false
	reverse : boolean = false
	maxWidth : number
	maxHeight : number
	random : number
	customList: number[]

	imgResources!: ImageResources
	metaResources!: ImageResources
	imgList: string[] = []
	totalCount: number = 0
	selectMode: boolean
	
	#tempImg: string
	#redraw: boolean
	#oldWidth: number = 0
	#columnEls: HTMLDivElement[] = []
	#selectedEls: (HTMLVideoElement|HTMLImageElement)[] = []
	
	#imgFocusIndex: number
	#pausedVideo: HTMLVideoElement 
	#pausedVideoUrl: string = ''

	constructor(parent: HTMLElement, columnContainer: HTMLElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.parent = parent;
		this.columnContainer = columnContainer;
		this.path = this.plugin.settings.galleryLoadPath;
		this.maxWidth = this.plugin.settings.width;
		if(this.plugin.settings.useMaxHeight)
		{
			this.maxHeight = this.plugin.settings.maxHeight;
		}
		this.#tempImg = GALLERY_LOADING_IMAGE;
	}

	haveColumnsChanged(): boolean
	{
		const columnCount = Math.ceil(this.columnContainer.offsetWidth/this.maxWidth);
		const result = columnCount != this.#columnEls.length;

		if(result)
		{
			this.#redraw = true;
		}

		return result;
	}

	async updateResources(): Promise<void>
	{
		this.metaResources = {}
		const infoFolder = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.imgDataFolder)
	
		if (infoFolder instanceof TFolder)
		{
			let cancel = false;
			const progress = new ProgressModal(this.plugin, infoFolder.children.length, ()=>{cancel = true;})
			progress.open();

			for (let i = 0; i < infoFolder.children.length; i++) 
			{
				if(cancel)
				{
					new Notice(loc('CANCEL_LOAD_NOTICE'));
					return;
				}
				
				progress.updateProgress(i);
				
				const info = infoFolder.children[i];
				let imgLink = await getimageLink(info as TFile, this.plugin);
		
				if(info && imgLink)
				{
					this.metaResources[imgLink] = info.path
				}
			}
			
			progress.updateProgress(infoFolder.children.length);
		}
	}

	async updateData()
	{
		[this.imgResources, this.totalCount ] = await this.#getImageResources(this.path,
			this.name,
			this.tag,
			this.matchCase,
			this.exclusive)
		this.imgList = Object.keys(this.imgResources)

		if(this.random > 0)
		{
			this.customList = [];
			if(this.random < this.imgList.length)
			{
				while(this.customList.length < this.random)
				{
					const value = Math.floor(Math.random()*this.imgList.length);

					if(!this.customList.contains(value))
					{
						this.customList.push(value);
					}
				}
			}
		}
		
		if (this.customList && this.customList.length > 0)
		{
			this.imgList = this.customList.filter(value => !Number.isNaN(value)).map(i => this.imgList[i])
		}

		if(this.reverse)
		{
			this.imgList = this.imgList.reverse()
		}

		this.#redraw = true;
	}

	async updateDisplay()
	{
		if(this.columnContainer.offsetWidth <= 0)
		{
			return;
		}

		if(!this.#redraw 
		&& this.columnContainer.offsetWidth >= this.#oldWidth 
		&& this.columnContainer.offsetWidth - this.#oldWidth < 20)
		{
			return;
		}

		this.#oldWidth = this.columnContainer.offsetWidth;

		if(!this.#redraw && !this.haveColumnsChanged())
		{
			this.#resize();
			return;
		}
		
		const scrollPosition = this.parent.scrollTop;
        this.columnContainer.empty();
		this.#columnEls = [];
		
		const columnCount = Math.ceil(this.columnContainer.offsetWidth/this.maxWidth);
		const columnWidth = (this.columnContainer.offsetWidth-55)/columnCount;

		for(let col = 0; col < columnCount; col++)
		{
			this.#columnEls.push(this.columnContainer.createDiv({ cls: 'gallery-grid-column' }));
			this.#columnEls[col].style.width = columnWidth+"px";
		}

		const selection: string[] = [];
		if(this.#selectedEls && this.#selectedEls.length > 0)
		{
			for (let i = 0; i < this.#selectedEls.length; i++) 
			{
				selection.push(this.#selectedEls[i].src);
			}

			this.#selectedEls = []
		}

		let index = 0;
		while(index < this.imgList.length)
		{
			for(let col = 0; col < this.#columnEls.length; col++)
			{
				if(index >= this.imgList.length)
				{
					break;
				}

				let source = this.imgList[index];
				let visualEl: HTMLVideoElement | HTMLImageElement;
				index++;
				
				if(source.match(VIDEO_REGEX))
				{
					const vid = this.#columnEls[col].createEl("video");
					vid.src = source;
					vid.classList.add("gallery-grid-vid");
					vid.controls = true;
					visualEl = vid;
				}
				else
				{
					const img = this.#columnEls[col].createEl("img");
					img.src = this.#tempImg;
					img.classList.add("gallery-grid-img");
					img.classList.add("lazy");
					img.loading = "lazy";
					img.alt = source;
					img.dataset.src = source;
					visualEl = img;
				}

				if(this.maxHeight > 10)
				{
					visualEl.style.maxHeight = this.maxHeight+"px";
				}

				// Multiselect code
				if(selection.contains(source))
				{
					this.#selectedEls.push(visualEl);
					visualEl.addClass("selected-item");
				}
			}
		}

		this.#redraw = false;
		setLazyLoading();
		
		this.parent.scrollTop = scrollPosition;
		await new Promise(f => setTimeout(f, 100));
		this.parent.scrollTop = scrollPosition;
	}

	getFilter(): string
	{
		let filterCopy = "```gallery"
		filterCopy += "\npath=" + this.path
		filterCopy += "\nname=" + this.name
		filterCopy += "\ntags=" + this.tag
		filterCopy += "\nmatchCase=" + this.matchCase
		filterCopy += "\nexclusive=" + this.exclusive
		filterCopy += "\nimgWidth=" + this.maxWidth
		filterCopy += "\nreverseOrder=" + this.reverse
		filterCopy += "\nrandom=" + this.random
		filterCopy += "\n```"

		return filterCopy;
	}

	setFilter(filter:string)
	{		
		const lines = filter.split('\n');
		for(let i = 0; i < lines.length; i++)
		{
		  const parts = lines[i].split('=');
		  if(parts.length <2)
		  {
			continue;
		  }

		  switch(parts[0].toLocaleLowerCase())
		  {
			case 'path' : 
			this.path = parts[1];
			break;
			case 'name' : 
			this.name = parts[1];
			break;
			case 'tags' : 
			this.tag = parts[1];
			break;
			case 'matchcase' : 
			this.matchCase = (parts[1] === "true");
			break;
			case 'exclusive' : 
			this.exclusive = (parts[1] === "true");
			break;
			case 'imgwidth' : 
			this.maxWidth = parseInt(parts[1]);
			break;
			case 'reverseorder' : 
			this.reverse = (parts[1] === "true");
			break;
			case 'random' : 
			this.random = parseInt(parts[1]);
			break;
			default : continue;
		  }
		}
	}

	async getImageInfo(imgPath:string, create:boolean): Promise<TFile|null>
	{
		if(this.plugin.settings.imgDataFolder == null)
		{
		  return null;
		}
	  
		if(!imgPath || imgPath == "")
		{
		  return
		}
		
		let infoFile = null
		let infoPath = this.metaResources[imgPath];
		infoFile = this.plugin.app.vault.getAbstractFileByPath(infoPath);

		if(infoFile)
		{
			return infoFile as TFile;
		}
	  
		if (create)
		{
			infoFile = await createMetaFile(imgPath, this.plugin);
			this.metaResources[imgPath] = infoFile.path
			return infoFile;
		}
	  
		// Not found, don't create
		return null
	}

	setupClickEvents(imageFocusEl : HTMLDivElement, focusVideo : HTMLVideoElement, focusImage: HTMLImageElement, infoView:GalleryInfoView = null)
	{
		this.parent.onclick = async (evt) =>
		{
			if (imageFocusEl.style.getPropertyValue('display') === 'block')
			{
				imageFocusEl.style.setProperty('display', 'none')
				// Clear Focus video
				focusVideo.src = ''
				// Clear Focus image
				focusImage.src = ''
				// Set Video Url back to disabled grid video
				if (this.#pausedVideo)
				{
					this.#pausedVideo.src = this.#pausedVideoUrl
				}
				// Hide focus image div
				focusImage.style.setProperty('display', 'none')
				// Hide focus video div
				focusVideo.style.setProperty('display', 'none')
				return;
			}

			const visualEl = evt.target as (HTMLVideoElement | HTMLImageElement)
				
			if(infoView)
			{
				await infoView.updateInfoDisplay(this.imgResources[visualEl.src]);
			}

			if(Keymap.isModifier(evt as UserEvent, 'Shift') || this.selectMode)
			{
				evt.stopImmediatePropagation();

				this.#selectElement(visualEl);
				return;
			}

			if (visualEl instanceof HTMLImageElement)
			{
				// Read New image info
				const focusImagePath = visualEl.src
				this.#imgFocusIndex = this.imgList.indexOf(focusImagePath)
				imageFocusEl.style.setProperty('display', 'block')
				updateFocus(focusImage, focusVideo, this.imgList[this.#imgFocusIndex], false)
			}

			if (visualEl instanceof HTMLVideoElement)
			{
				// Read video info
				const focusImagePath = visualEl.src
				this.#imgFocusIndex = this.imgList.indexOf(focusImagePath)
				imageFocusEl.style.setProperty('display', 'block')
				// Save clicked video info to set it back later
				this.#pausedVideo = visualEl
				this.#pausedVideoUrl = this.#pausedVideo.src
				// disable clicked video
				this.#pausedVideo.src = ''
				updateFocus(focusImage, focusVideo, this.imgList[this.#imgFocusIndex], true)
			}
		};

		this.parent.addEventListener('contextmenu', async (e) =>
		{
			if(this.#selectedEls.length == 0 && (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement))
			{
				new ImageMenu(e.pageX, e.pageY, [e.target], this, this.plugin);
			}
			else
			{
				new ImageMenu(e.pageX, e.pageY, this.#selectedEls, this, this.plugin);
			}
		})

		const focusShift = async () =>
		{	
			if (this.#imgFocusIndex < 0)
			{
				this.#imgFocusIndex = this.imgList.length - 1
			}
			
			if (this.#imgFocusIndex >= this.imgList.length)
			{
				this.#imgFocusIndex = 0
			}

			if (this.imgList[this.#imgFocusIndex].match(VIDEO_REGEX))
			{
				updateFocus(focusImage, focusVideo, this.imgList[this.#imgFocusIndex], true)
			}
			else
			{
				updateFocus(focusImage, focusVideo, this.imgList[this.#imgFocusIndex], false)
			}
			
			if(infoView)
			{
				await infoView.updateInfoDisplay(this.imgResources[this.imgList[this.#imgFocusIndex]]);
			}
		}

		document.addEventListener('keydown', async (event) =>
		{
			// Mobile clicks don't seem to include shift key information
			if(event.shiftKey)
			{
				this.selectMode = true;
			}

		}, false)

		document.addEventListener('keyup', async (event) =>
		{
			if(this.selectMode && !event.shiftKey)
			{
				this.selectMode = false;
			}

			if (imageFocusEl.style.getPropertyValue('display') != 'block')
			{
			return;
			}

			if (infoView && infoView.sourceEl.style.getPropertyValue('display') === 'block')
			{
				return;
			}

			switch (event.key)
			{
			case 'ArrowLeft':
				this.#imgFocusIndex--;
				await focusShift();
				break;
			case 'ArrowRight':
				this.#imgFocusIndex++
				await focusShift();
				break;
			}

		}, false)
	}

	selectAll()
	{
		this.#selectedEls = [];

		for (let col = 0; col < this.#columnEls.length; col++) 
		{
			const column = this.#columnEls[col];

			for (let index = 0; index < column.childElementCount; index++) 
			{
				this.#selectElement(column.children[index] as (HTMLVideoElement | HTMLImageElement));
			}
		}
	}
	
	clearSelection()
	{
		if(this.#selectedEls && this.#selectedEls.length > 0)
		{
			for (let i = 0; i < this.#selectedEls.length; i++) 
			{
				this.#selectedEls[i].removeClass("selected-item");
			}

			this.#selectedEls = []
		}
	}

	#selectElement(visualEl:(HTMLVideoElement | HTMLImageElement))
	{
		if(this.#selectedEls.contains(visualEl))
		{
			this.#selectedEls.remove(visualEl);
			visualEl.removeClass("selected-item");
		}
		else
		{
			this.#selectedEls.push(visualEl);
			visualEl.addClass("selected-item");
		}
	}

	#resize()
	{
		const columnWidth = (this.columnContainer.offsetWidth-55)/this.#columnEls.length;

		for(let col = 0; col < this.#columnEls.length; col++)
		{
			this.#columnEls[col].style.width = columnWidth+"px";
		}
	}

	
	async #getImageResources(path: string, name: string, tag: string, matchCase: boolean, exclusive: boolean): Promise<[ImageResources,number]>
	{
		const imgList: ImageResources = {}
		const vaultFiles = this.plugin.app.vault.getFiles()
		
		path = normalizePath(path);

		let reg
		try 
		{
			reg = new RegExp(`^${path}.*${name}.*$`)
			if (path === '/')
			{
				reg = new RegExp(`^.*${name}.*$`)
			}
		} 
		catch (error)
		{
			console.log(loc('BAD_REGEX_WARNING'))
			reg = '.*'
		}
		
		let filterTags: string[] = null;
		
		if(tag != null && tag != "")
		{
			filterTags = tag.split(' ');
			for(let k = 0; k < filterTags.length; k++)
			{
				if(filterTags[k][0] == '-')
				{
					filterTags.unshift(filterTags[k]);
					filterTags.splice(k+1, 1);
				}
				if(filterTags[k].trim() == '')
				{
					filterTags.splice(k+1, 1);
				}
			}
		}

		let count: number = 0;
		for (const file of vaultFiles)
		{
			if (EXTENSIONS.contains(file.extension.toLowerCase()) && file.path.match(reg) )
			{
				count++;
				if( await this.#containsTags(file, filterTags, matchCase, exclusive))
				{
					imgList[this.plugin.app.vault.adapter.getResourcePath(file.path)] = file.path
				}
			}
		}
		return [imgList, count];
	}
	
	async #containsTags(file: TFile, filterTags: string[], matchCase: boolean, exclusive: boolean): Promise<boolean>
	{
		if(filterTags == null || filterTags.length == 0)
		{
			return true;
		}

		let imgTags: string[] = [];
		this.plugin.app.metadataCache.getFileCache(file)
		let infoFile = await this.getImageInfo(file.path, false);
		if(infoFile)
		{
			let imgInfoCache = this.plugin.app.metadataCache.getFileCache(infoFile)
			if (imgInfoCache)
			{
				imgTags = getAllTags(imgInfoCache)
			}
		}

		let hasPositive: boolean = false;

		for(let k = 0; k < filterTags.length; k++)
		{
			let negate: boolean = false;
			let tag = filterTags[k];
			if(tag[0] == '-')
			{
				tag = tag.substring(1);
				negate = true;
			}
			else
			{
				hasPositive = true;
			}

			if(tag == "")
			{
				continue;
			}

			if(this.#containsTag(tag, imgTags, matchCase))
			{
				if(negate)
				{
					return false;
				}
				
				if(!exclusive)
				{
					return true;
				}
			}
			else if(exclusive && !negate)
			{
				return false;
			}
		}

		if(!hasPositive)
		{
			return true;
		}
		
		return exclusive;
	};

	#containsTag(tagFilter:string, tags: string[], matchCase: boolean): boolean
	{
		if(!matchCase)
		{
			tagFilter = tagFilter.toLowerCase();
		}

		for(let i = 0; i < tags.length; i++)
		{
			if(matchCase)
			{
				if(tags[i].contains(tagFilter))
				{
					return true;
				}
			}
			else
			{
				if(tags[i].toLowerCase().contains(tagFilter))
				{
					return true;
				} 
			}
		}

		return false;
	}

}