import type GalleryTagsPlugin from "../main"
import type { ImageResources } from '../utils'
import {
	VIDEO_REGEX,
    getImageResources,
	setLazyLoading
  } from '../utils'

export class ImageGrid
{
	plugin: GalleryTagsPlugin
	parent: HTMLElement
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
	imgList: string[] = []
	totalCount: number = 0
	
	#tempImg: string
	#redraw: boolean
	#oldWidth: number = 0
	#columnEls: HTMLDivElement[] = []

	constructor(parent: HTMLElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.parent = parent;
		this.path = this.plugin.settings.galleryLoadPath;
		this.maxWidth = this.plugin.settings.width;
		if(this.plugin.settings.useMaxHeight)
		{
			this.maxHeight = this.plugin.settings.maxHeight;
		}
		this.#tempImg = "data:image/gif;base64,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"
	}

	haveColumnsChanged(): boolean
	{
		const columnCount = Math.ceil(this.parent.offsetWidth/this.maxWidth);
		const result = columnCount != this.#columnEls.length;

		if(result)
		{
			this.#redraw = true;
		}

		return result;
	}

	async updateData()
	{
		[this.imgResources, this.totalCount ] = await getImageResources(this.path,
			this.name,
			this.tag,
			this.matchCase,
			this.exclusive,
			this.plugin.app.vault.getFiles(),
			this.plugin.app.vault.adapter,
			this.plugin)
		
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

	updateDisplay()
	{
		if(this.parent.offsetWidth <= 0)
		{
			return;
		}

		if(!this.#redraw 
		&& this.parent.offsetWidth >= this.#oldWidth 
		&& this.parent.offsetWidth - this.#oldWidth < 20)
		{
			return;
		}

		this.#oldWidth = this.parent.offsetWidth;

		if(!this.#redraw && !this.haveColumnsChanged())
		{
			this.#resize();
			return;
		}

        this.parent.empty();
		this.#columnEls = [];
		
		const columnCount = Math.ceil(this.parent.offsetWidth/this.maxWidth);
		const columnWidth = (this.parent.offsetWidth-55)/columnCount;

		for(let col = 0; col < columnCount; col++)
		{
			this.#columnEls.push(this.parent.createDiv({ cls: 'gallery-grid-column' }));
			this.#columnEls[col].style.width = columnWidth+"px";
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
				index++;

				if(source.match(VIDEO_REGEX))
				{
					const vid = this.#columnEls[col].createEl("video");
					vid.src = source;
					vid.classList.add("gallery-grid-vid");
					vid.controls = true;
					if(this.maxHeight > 10)
					{
						vid.style.maxHeight = this.maxHeight+"px";
					}
				}
				else
				{
					const img = this.#columnEls[col].createEl("img");
					img.src = this.#tempImg;
					img.classList.add("gallery-grid-img");
					img.classList.add("lazy");
					img.loading = "lazy";
					img.alt = "testing alt text";
					img.dataset.src = source;
					if(this.maxHeight > 10)
					{
						img.style.maxHeight = this.maxHeight+"px";
					}
				}
			}
		}

		this.#redraw = false;
		setLazyLoading();
	}

	#resize()
	{
		const columnWidth = (this.parent.offsetWidth-55)/this.#columnEls.length;

		for(let col = 0; col < this.#columnEls.length; col++)
		{
			this.#columnEls[col].style.width = columnWidth+"px";
		}
	}
}