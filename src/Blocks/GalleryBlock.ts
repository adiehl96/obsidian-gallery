import type { Vault } from 'obsidian'
import { MarkdownRenderer } from 'obsidian'
import type { GalleryBlockArgs } from '../utils'
import { GALLERY_DISPLAY_USAGE } from '../utils'
import type GalleryTagsPlugin from '../main'
import { ImageGrid } from '../DisplayObjects/ImageGrid'
import Gallery from '../svelte/Gallery.svelte'

export class GalleryBlock
{
  async galleryDisplay(source: string, el: HTMLElement, vault: Vault, plugin: GalleryTagsPlugin)
  {
    const args: GalleryBlockArgs = {
      type: 'grid',
      path: '',
      name: '',
      tags: '',
      exclusive: 'false',
      matchCase: 'false',
      imgWidth: 200,
      imgHeight: 0,
      divWidth: 100,
      divAlign: 'left',
      divHeight: 0,
      reverseOrder: 'false',
      customList: '',
      random: 0
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

    // Handle problematic arguments
    if (!args.path || !args.type)
    {
      MarkdownRenderer.render(plugin.app, GALLERY_DISPLAY_USAGE, elCanvas, '/', plugin)
      return;
    }
    
    const imagesContainer = elCanvas.createEl('ul')
    const imageGrid = new ImageGrid(elCanvas, imagesContainer, plugin);
    imageGrid.path = args.path;
    imageGrid.name = args.name;
    imageGrid.tag = args.tags;
    imageGrid.reverse = args.reverseOrder === 'true';
    imageGrid.maxWidth = args.imgWidth;
    if(args.imgHeight > 10)
    {
      imageGrid.maxHeight = args.imgHeight;
    }
    imageGrid.exclusive = args.exclusive === 'true';
    imageGrid.matchCase = args.matchCase === 'true';
    imageGrid.reverse = args.reverseOrder === 'true';
    imageGrid.random = args.random;
    
    if (args.customList)
    {
      imageGrid.customList = args.customList.split(' ').map(i => parseInt(i));
    }

    await imageGrid.updateResources();
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
