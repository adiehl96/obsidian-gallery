import { Keymap, normalizePath, type UserEvent, getAllTags, TFile, Notice } from "obsidian"
import type GalleryTagsPlugin from "../main"
import
 {
	getImageInfo,
	setLazyLoading,
	updateFocus,
	validString
} from '../utils'
import 
{
	GALLERY_LOADING_IMAGE,
	VIDEO_REGEX
} from '../TechnicalFiles/Constants'
import { GalleryInfoView } from "./GalleryInfoView"
import { ImageMenu } from "../Modals/ImageMenu"
import { loc } from '../Loc/Localizer'

export enum Sorting
{
	UNSORTED,
	NAME,
	PATH,
	CDATE,
	MDATE,
	SIZE
}

export class ImageGrid
{
	plugin: GalleryTagsPlugin
	path: string;
	name: string;
	tag: string;
	matchCase: boolean;
	exclusive: boolean;
	sorting: Sorting;
	reverse : boolean;
	maxWidth : number;
	maxHeight : number;
	random : number;
	customList: number[];

	imgList: string[] = [];
	totalCount: number = 0;
	selectMode: boolean = false;
	
	#tempImg: string
	#redraw: boolean = false;
	#oldWidth: number = 0;
	#columnEls: HTMLDivElement[] = [];
	#selectedEls: (HTMLVideoElement|HTMLImageElement)[] = [];
	
	displayEl: HTMLDivElement
	columnContainer: HTMLUListElement
	imageFocusEl : HTMLDivElement
	focusImage: HTMLImageElement
	focusVideo: HTMLVideoElement
	infoView:GalleryInfoView
	#imgFocusIndex: number
	#pausedVideo: HTMLVideoElement 
	#pausedVideoUrl: string = '';


	constructor(parent: HTMLDivElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.displayEl = parent;
		this.columnContainer = this.displayEl.createEl('ul');
		this.#tempImg = GALLERY_LOADING_IMAGE;
		this.clearFilter();
	}

	haveColumnsChanged(): boolean
	{
		const columnCount = Math.ceil(this.areaWidth()/this.maxWidth);
		const result = columnCount != this.#columnEls.length;

		if(result)
		{
			this.#redraw = true;
		}

		return result;
	}

	areaWidth(): number
	{
		return this.columnContainer.offsetWidth
	}

	stringToSort(sort:string)
	{
		sort = sort.toLocaleLowerCase();
		switch(sort)
		{
		  case Sorting[Sorting.UNSORTED].toLocaleLowerCase(): this.sorting = Sorting.UNSORTED; break;
		  case Sorting[Sorting.NAME].toLocaleLowerCase(): this.sorting = Sorting.NAME; break;
		  case Sorting[Sorting.PATH].toLocaleLowerCase(): this.sorting = Sorting.PATH; break;
		  case Sorting[Sorting.CDATE].toLocaleLowerCase(): this.sorting = Sorting.CDATE; break;
		  case Sorting[Sorting.MDATE].toLocaleLowerCase(): this.sorting = Sorting.MDATE; break;
		  case Sorting[Sorting.SIZE].toLocaleLowerCase(): this.sorting = Sorting.SIZE; break;
		  default: this.sorting = Sorting.UNSORTED; break;
		}
	}

	updateSort(sorting:Sorting, reverse:boolean)
	{
		if(!this.#redraw 
			&& sorting == this.sorting 
			&& reverse == this.reverse)
		{
			return;
		}

		if(this.#redraw || sorting != this.sorting)
		{
			this.sorting = sorting;
			switch(this.sorting)
			{
				case Sorting.UNSORTED: break;
				case Sorting.NAME: 
				{
					this.imgList = this.imgList.sort((a,b)=>
					{
						let as = this.plugin.imgResources[a];
						let bs = this.plugin.imgResources[b];
						as = as.substring(as.lastIndexOf('/'));
						bs = bs.substring(bs.lastIndexOf('/'));
						return as.localeCompare(bs);
					}); 
					break;
				}
				case Sorting.PATH: 
				{
					this.imgList = this.imgList.sort((a,b)=>
					{
						return this.plugin.imgResources[a].localeCompare(this.plugin.imgResources[b]);
					}); 
					break;
				}
				case Sorting.CDATE: 
				{
					this.imgList = this.imgList.sort((a,b)=>
					{
						let af = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[a]) as TFile;
						let bf = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[b]) as TFile;

						if(af.stat.ctime < bf.stat.ctime)
						{
							return 1;
						}
						if(af.stat.ctime == bf.stat.ctime)
						{
							return 0;
						}
						return -1;
					}); 
					break;
				}
				case Sorting.MDATE: 
				{
					this.imgList = this.imgList.sort((a,b)=>
					{
						let ap = this.plugin.metaResources[this.plugin.imgResources[a]];
						let bp = this.plugin.metaResources[this.plugin.imgResources[b]];

						let af: TFile = this.plugin.app.vault.getAbstractFileByPath(ap) as TFile;
						let bf: TFile = this.plugin.app.vault.getAbstractFileByPath(bp) as TFile;
						if(!af)
						{
							af = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[a]) as TFile;
						}
						if(!bf)
						{
							bf = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[b]) as TFile;
						}

						if(af.stat.mtime < bf.stat.mtime)
						{
							return 1;
						}
						if(af.stat.mtime == bf.stat.mtime)
						{
							return 0;
						}
						return -1;
					}); 
					break;
				}
				case Sorting.SIZE:
				{
					this.imgList = this.imgList.sort((a,b)=>
					{
						let af = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[a]) as TFile;
						let bf = this.plugin.app.vault.getAbstractFileByPath(this.plugin.imgResources[b]) as TFile;

						if(af.stat.size < bf.stat.size)
						{
							return 1;
						}
						if(af.stat.size == bf.stat.size)
						{
							return 0;
						}
						return -1;
					}); 
					break;
				}
			}
			this.#redraw = true;
		}

		if(this.#redraw)
		{
			if(reverse)
			{
				this.imgList = this.imgList.reverse();
			}
		}
		else if(reverse != this.reverse)
		{
			this.imgList = this.imgList.reverse();
			this.#redraw = true;
		}

		this.reverse = reverse;
	}

	async updateLastFilter()
	{
		this.plugin.platformSettings().lastFilter = this.getFilter();
		await this.plugin.saveSettings();
	}

	async updateData()
	{
		await this.#applyFilter(this.path,
			this.name,
			this.tag,
			this.matchCase,
			this.exclusive)

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

		this.#redraw = true;
		this.updateSort(this.sorting, this.reverse);
		
	}

	async updateDisplay()
	{
		if(this.areaWidth() <= 0)
		{
			return;
		}

		if(!this.#redraw 
		&& this.areaWidth() >= this.#oldWidth 
		&& this.areaWidth() - this.#oldWidth < 20)
		{
			return;
		}

		this.#oldWidth = this.areaWidth();

		if(!this.#redraw && !this.haveColumnsChanged())
		{
			this.#resize();
			return;
		}
		
		const scrollPosition = this.displayEl.scrollTop;
        this.columnContainer.empty();
		this.#columnEls = [];
		
		const columnCount = Math.ceil(this.areaWidth()/this.maxWidth);
		const columnWidth = (this.areaWidth()-55)/columnCount;

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
		
		this.displayEl.scrollTop = scrollPosition;
		await new Promise(f => setTimeout(f, 100));
		this.displayEl.scrollTop = scrollPosition;
	}

	setNamedFilter(filter:string)
	{
		this.plugin.settings.namedFilters
		for (let i = 0; i < this.plugin.settings.namedFilters.length; i++) 
		{
			if(this.plugin.settings.namedFilters[i].name.toLowerCase() == filter.toLowerCase())
			{
				this.setIndexedFilter(i);
				return;
			}
		}
		
		console.log(loc('WARN_NO_FILTER_NAME', filter));
		new Notice(loc('WARN_NO_FILTER_NAME', filter));
	}

	setIndexedFilter(index:number)
	{
		if(this.plugin.settings.namedFilters.length > index)
		{
			this.setFilter(this.plugin.settings.namedFilters[index].filter);
		}
		else
		{
			console.log(loc('WARN_NO_FILTER_INDEX', index.toString()));
			new Notice(loc('WARN_NO_FILTER_INDEX', index.toString()));
		}
	}

	getFilter(): string
	{
		let filterCopy = "```gallery"
		filterCopy += "\npath=" + this.path;
		filterCopy += "\nname=" + this.name;
		filterCopy += "\ntags=" + this.tag;
		filterCopy += "\nmatchCase=" + this.matchCase;
		filterCopy += "\nexclusive=" + this.exclusive;
		filterCopy += "\nimgWidth=" + this.maxWidth;
		filterCopy += "\nsort=" + Sorting[this.sorting];
		filterCopy += "\nreverseOrder=" + this.reverse;
		filterCopy += "\nrandom=" + this.random;
		filterCopy += "\n```"

		return filterCopy;
	}

	setFilter(filter:string)
	{		
		const lines = filter.split(/[\n\r]/);
		for(let i = 0; i < lines.length; i++)
		{
		  const parts = lines[i].split('=');
		  if(parts.length <2)
		  {
			continue;
		  }

		  parts[1] = parts[1].trim();

		  switch(parts[0].trim().toLocaleLowerCase())
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
			this.matchCase = (parts[1].toLocaleLowerCase() === "true");
			break;
			case 'exclusive' : 
			this.exclusive = (parts[1].toLocaleLowerCase() === "true");
			break;
			case 'imgwidth' : 
			this.maxWidth = parseInt(parts[1]);
			break;
			case 'sort' : 
			this.stringToSort(parts[1]);
			break;
			case 'reverseorder' : 
			this.reverse = (parts[1].toLocaleLowerCase() === "true");
			break;
			case 'random' : 
			this.random = parseInt(parts[1]);
			break;
			default : continue;
		  }
		}
	}

	clearFilter()
	{
		this.path = "";
		this.name = "";
		this.tag = "";
		this.matchCase = false;
		this.exclusive = false;
		this.sorting = Sorting.UNSORTED;
		this.reverse = false;
		this.random = 0;
		this.maxWidth = this.plugin.platformSettings().width;

		if(this.plugin.platformSettings().useMaxHeight)
		{
			this.maxHeight = this.plugin.platformSettings().maxHeight;
		}
		else
		{
			this.maxHeight = 0;
		}

		this.random = 0;
		this.customList = null;
	}

	setupClickEvents(infoView:GalleryInfoView = null)
	{
    	// Create gallery display Element		
		this.imageFocusEl = this.displayEl.createDiv({ cls: 'ob-gallery-image-focus', attr: { style: 'display: none;' } })
		const focusElContainer = this.imageFocusEl.createDiv({ attr: { class: 'focus-element-container' } })
		this.focusImage = focusElContainer.createEl('img', { attr: { style: 'display: none;' } })
		this.focusVideo = focusElContainer.createEl('video', { attr: { controls: 'controls', src: ' ', style: 'display: none; margin:auto;' } })
	
		this.infoView = infoView;
		
		if ('ontouchstart' in document.documentElement === true)
		{
			this.displayEl.addEventListener('touchstart', (e) => {this.vidTouch(e)},true);
		}
		this.displayEl.addEventListener('click', (e) => {this.itemClick(e)});

		this.displayEl.addEventListener('contextmenu', async (e) =>
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
				updateFocus(this.focusImage, this.focusVideo, this.imgList[this.#imgFocusIndex], true)
			}
			else
			{
				updateFocus(this.focusImage, this.focusVideo, this.imgList[this.#imgFocusIndex], false)
			}
			
			if(infoView)
			{
				await infoView.updateInfoDisplay(this.plugin.getImgResources()[this.imgList[this.#imgFocusIndex]]);
			}
			else
			{
				infoView = await GalleryInfoView.OpenLeaf(this.plugin, this.plugin.getImgResources()[this.imgList[this.#imgFocusIndex]]);
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

			if (this.imageFocusEl.style.getPropertyValue('display') != 'block')
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

	async itemClick (evt:Event)
	{
		if (this.imageFocusEl.style.getPropertyValue('display') === 'block')
		{
			this.imageFocusEl.style.setProperty('display', 'none')
			// Clear Focus video
			this.focusVideo.src = ''
			// Clear Focus image
			this.focusImage.src = ''
			// Set Video Url back to disabled grid video
			if (this.#pausedVideo)
			{
				this.#pausedVideo.src = this.#pausedVideoUrl
			}
			// Hide focus image div
			this.focusImage.style.setProperty('display', 'none')
			// Hide focus video div
			this.focusVideo.style.setProperty('display', 'none')
			return;
		}
		evt.stopImmediatePropagation();

		let visualEl: (HTMLVideoElement | HTMLImageElement);
		if(evt.target instanceof HTMLVideoElement || evt.target instanceof HTMLImageElement)
		{
			visualEl = evt.target;
		}
			
		if(this.infoView)
		{
			await this.infoView.updateInfoDisplay(this.plugin.getImgResources()[visualEl.src]);
		}
		else
		{
			this.infoView = await GalleryInfoView.OpenLeaf(this.plugin, this.plugin.getImgResources()[visualEl.src]);
		}

		if(Keymap.isModifier(evt as UserEvent, 'Shift') || this.selectMode)
		{
			if(!visualEl.classList.contains("gallery-grid-vid") && !visualEl.classList.contains("gallery-grid-img"))
			{
				return;
			}

			evt.stopImmediatePropagation();

			this.#selectElement(visualEl);
			return;
		}

		if (visualEl instanceof HTMLImageElement)
		{
			// Read New image info
			const focusImagePath = visualEl.src
			this.#imgFocusIndex = this.imgList.indexOf(focusImagePath)
			this.imageFocusEl.style.setProperty('display', 'block')
			updateFocus(this.focusImage, this.focusVideo, this.imgList[this.#imgFocusIndex], false)
		}

		if (visualEl instanceof HTMLVideoElement)
		{
			// Read video info
			const focusImagePath = visualEl.src
			this.#imgFocusIndex = this.imgList.indexOf(focusImagePath)
			this.imageFocusEl.style.setProperty('display', 'block')
			// Save clicked video info to set it back later
			this.#pausedVideo = visualEl
			this.#pausedVideoUrl = this.#pausedVideo.src
			// disable clicked video
			this.#pausedVideo.src = ''
			updateFocus(this.focusImage, this.focusVideo, this.imgList[this.#imgFocusIndex], true)
		}
	}
	async vidTouch (evt:Event)
	{
		let visualEl: (HTMLVideoElement);
		if(evt.target instanceof HTMLVideoElement)
		{
			this.itemClick(evt);
		}
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
		const columnWidth = (this.areaWidth()-55)/this.#columnEls.length;

		for(let col = 0; col < this.#columnEls.length; col++)
		{
			this.#columnEls[col].style.width = columnWidth+"px";
		}
	}

	
	async #applyFilter(path: string, name: string, tag: string, matchCase: boolean, exclusive: boolean): Promise<void>
	{
		const keyList = Object.keys(this.plugin.getImgResources());
		
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
		
		if(validString(tag))
		{
			filterTags = tag.split(' ');
			for(let k = 0; k < filterTags.length; k++)
			{
				if(filterTags[k][0] == '-')
				{
					filterTags.unshift(filterTags[k]);
					filterTags.splice(k+1, 1);
				}
				if(!validString(filterTags[k]))
				{
					filterTags.splice(k+1, 1);
				}
			}
		}

		this.imgList= [];
		for (const key of keyList)
		{
			const file = this.plugin.getImgResources()[key];
			if (file.match(reg))
			{
				if( await this.#containsTags(file, filterTags, matchCase, exclusive))
				{
					this.imgList.push(key);
				}
			}
		}
	}
	
	async #containsTags(filePath: string, filterTags: string[], matchCase: boolean, exclusive: boolean): Promise<boolean>
	{
		if(filterTags == null || filterTags.length == 0)
		{
			return true;
		}

		let imgTags: string[] = [];
		let infoFile = await getImageInfo(filePath, false, this.plugin);
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

			if(!validString(tag))
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