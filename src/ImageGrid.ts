import type GalleryTagsPlugin from "./main"
import type { ImageResources } from './utils'
import {
    getImageResources, 
	splitcolumns, 
	setLazyLoading
  } from './utils'

export class ImageGrid
{
	plugin: GalleryTagsPlugin
	parent: HTMLElement
	path: string = ""
	name: string = ""
	tag: string = ""
	exclusive: boolean = false
	reverse : boolean = false
	maxWidth : number
	imgResources!: ImageResources
	imgList: string[] = []
	totalCount: number = 0
	
	tempImg: string

	constructor(parent: HTMLElement, plugin: GalleryTagsPlugin)
	{
		this.plugin = plugin;
		this.parent = parent;
		this.path = this.plugin.settings.galleryLoadPath;
		this.maxWidth = this.plugin.settings.width;
		this.tempImg = this.plugin.app.vault.adapter.getResourcePath(".obsidian/plugins/obsidian-tagged-gallery/loading.gif")
	}

	async updateData()
	{
		[this.imgResources, this.totalCount ] = await getImageResources(this.path,
			this.name,
			this.tag,
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
		const [columns, columnWidth] = splitcolumns(this.imgList, this.parent, this.plugin.settings.width)

		for(let col = 0; col < columns.length; col++)
		{
			const images = columns[col];
			const columnEL = this.parent.createDiv({ cls: 'gallery-grid-column' });
			for(let row = 0; row < images.length; row++)
			{
				if(images[row].contains(".mp4") || images[row].contains(".webm"))
				{
					const vid = columnEL.createEl("video");
					vid.src = images[row];
					vid.classList.add("gallery-grid-vid");
					vid.controls = true;
					vid.width = columnWidth;
				}
				else
				{
					const img = columnEL.createEl("img");
					img.src = this.tempImg;
					img.classList.add("gallery-grid-img");
					img.classList.add("lazy");
					img.loading = "lazy";
					img.alt = "testing alt text";
					img.dataset.src = images[row];
					img.width = columnWidth;
				}
			}
		}

		setLazyLoading();
	} 
}