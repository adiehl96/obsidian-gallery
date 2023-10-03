import type { Vault } from 'obsidian'
import { MarkdownRenderer } from 'obsidian'
import type GalleryTagsPlugin from '../main'
import { ImageGrid, Sorting } from '../DisplayObjects/ImageGrid'
import Gallery from '../svelte/Gallery.svelte'
import { loc } from '../Loc/Localizer'
import { validString } from '../utils'

export interface GalleryBlockArgs
{
  type: string
  filter: string
  path: string
  name: string
  tags: string
  exclusive: string
  matchCase: string
  imgWidth: number
  imgHeight: number
  divWidth: number
  divAlign: string
  divHeight: number
  sort: string
  reverseOrder: string
  customList: string
  random: number
}

export class GalleryBlock
{
  async galleryDisplay(source: string, el: HTMLElement, vault: Vault, plugin: GalleryTagsPlugin)
  {
    const args: GalleryBlockArgs = {
      type: 'grid',
      filter: null,
      path: null,
      name: null,
      tags: null,
      exclusive: null,
      matchCase: null,
      imgWidth: -1,
      imgHeight: -1,
      divWidth: 100,
      divAlign: 'left',
      divHeight: -1,
      sort: null,
      reverseOrder: null,
      customList: null,
      random: -1
    };

    source.split('\n').map(e =>
    {
      if (e)
      {
        const param = e.trim().split('=');
        (args as any)[param[0]] = param[1]?.trim()
      }
    })

    const elCanvas = el.createDiv({
      cls: 'ob-gallery-display-block',
      attr: { style: `width: ${args.divWidth}%; height: ${(args.divHeight >10 )? args.divHeight+"px" : "auto"}; float: ${args.divAlign}` }
    })
    
    const imagesContainer = elCanvas.createEl('ul')
    const imageGrid = new ImageGrid(elCanvas, imagesContainer, plugin);

    if(validString(args.filter))
    {
      if(/([lL][aA][sS][tT][_ ]?[uU][sS][eE][dD])/.exec(args.filter) != null)
      {
        if(validString(plugin.platformSettings().lastFilter))
        {
          imageGrid.setFilter(plugin.platformSettings().lastFilter);
        }
      }
      else
      {
        imageGrid.setNamedFilter(args.filter);
      }
    }

    if(validString(args.path))
    {
      imageGrid.path = args.path;
    }
    if(validString(args.name))
    {
      imageGrid.name = args.name;
    }
    if(validString(args.tags))
    {
      imageGrid.tag = args.tags;
    }
    if(validString(args.sort))
    {
      imageGrid.stringToSort(args.sort);
    }
    if(validString(args.reverseOrder))
    {
      imageGrid.reverse = args.reverseOrder === 'true';
    }
    if(args.imgWidth >= 0)
    {
      imageGrid.maxWidth = args.imgWidth;
    }
    if(args.imgHeight >= 0)
    {
      imageGrid.maxHeight = args.imgHeight;
    }
    if(validString(args.exclusive))
    {
      imageGrid.exclusive = args.exclusive === 'true';
    }
    if(validString(args.matchCase))
    {
      imageGrid.matchCase = args.matchCase === 'true';
    }
    if(args.random >= 0)
    {
      imageGrid.random = args.random;
    }
    
    if (validString(args.customList))
    {
      imageGrid.customList = args.customList.split(' ').map(i => parseInt(i));
    }

    await imageGrid.updateData();

    if (args.type === 'grid')
    {
      imageGrid.updateDisplay();
      plugin.onResize = () =>
      {
        imageGrid.updateDisplay();
      }
      
      const imageFocusEl = elCanvas.createDiv({ cls: 'ob-gallery-image-focus' })
      const focusElContainer = imageFocusEl.createDiv({ attr: { class: 'focus-element-container' } });
      const focusImage = focusElContainer.createEl('img', { attr: { style: 'display: none;' } });
      const focusVideo = focusElContainer.createEl('video', { attr: { controls: 'controls', src: ' ', style: 'display: none; margin: auto;' } });

      imageGrid.setupClickEvents(imageFocusEl, focusVideo, focusImage);
    }

    if (args.type === 'active-thumb')
    {
      new Gallery({
        props: {
          imgList: imageGrid.imgList,
          width: args.imgWidth / 50,
          fillFree: true
        },
        target: elCanvas
      })
    }
  }
}
