import type GalleryTagsPlugin from "./main"
import type { ImageResources } from './utils'
import {
    getImageResources,
	setLazyLoading
  } from './utils'

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
	imgResources!: ImageResources
	imgList: string[] = []
	totalCount: number = 0
	
	tempImg: string
	columnCount: number

	constructor(parent: HTMLElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.parent = parent;
		this.path = this.plugin.settings.galleryLoadPath;
		this.maxWidth = this.plugin.settings.width;
		this.tempImg = this.plugin.app.vault.adapter.getResourcePath(".obsidian/plugins/obsidian-tagged-gallery/loading.gif")
	}

	haveColumnsChanged(): boolean
	{
		const newColumnCount = Math.ceil(this.parent.innerWidth/this.maxWidth);

		return this.columnCount != newColumnCount;
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
		if(this.reverse)
		{
			this.imgList = this.imgList.reverse()
		}
	}

	updateDisplay()
	{
		this.columnCount = Math.ceil(this.parent.innerWidth/this.maxWidth);
		const columnWidth = (this.parent.innerWidth-15)/this.columnCount;
		const columnEls: HTMLDivElement[] = [];

		for(let col = 0; col < this.columnCount; col++)
		{
			columnEls.push(this.parent.createDiv({ cls: 'gallery-grid-column' }));
		}

		let index = 0;
		while(index < this.imgList.length)
		{
			for(let col = 0; col < this.columnCount; col++)
			{
				if(index >= this.imgList.length)
				{
					break;
				}

				let source = this.imgList[index];
				index++;

				if(source.contains(".mp4") || source.contains(".webm"))
				{
					const vid = columnEls[col].createEl("video");
					vid.src = source;
					vid.classList.add("gallery-grid-vid");
					vid.controls = true;
					vid.width = columnWidth;
				}
				else
				{
					const img = columnEls[col].createEl("img");
					img.src = this.tempImg;
					img.classList.add("gallery-grid-img");
					img.classList.add("lazy");
					img.loading = "lazy";
					img.alt = "testing alt text";
					img.dataset.src = source;
					img.width = columnWidth;
				}
			}
		}

		setLazyLoading();
	}
}