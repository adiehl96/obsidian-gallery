import type { Vault, MetadataCache, FrontMatterCache, EditorPosition } from 'obsidian'
import { MarkdownRenderer, TFile, getAllTags, Platform, MarkdownView, normalizePath } from 'obsidian'
import { extractColors } from '../node_modules/extract-colors'
import type { GalleryBlockArgs, InfoBlockArgs } from './utils'
import
  {
    EXTENSIONS, GALLERY_DISPLAY_USAGE, EXTRACT_COLORS_OPTIONS,
    VIDEO_REGEX,
    getImgInfo, GALLERY_INFO_USAGE, searchForFile
  } from './utils'
import type GalleryTagsPlugin from './main'
import { ImageGrid } from './DisplayObjects/ImageGrid'
import { GalleryInfo } from './DisplayObjects/GalleryInfo'
import Gallery from './svelte/Gallery.svelte'

export class GalleryProcessor
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

  async galleryImageInfo(source: string, el: HTMLElement, sourcePath: string, vault: Vault, metadata: MetadataCache, plugin: GalleryTagsPlugin)
  {
    const args: InfoBlockArgs = {
      imgPath: '',
      ignoreInfo: ''
    };

    source.split('\n').map(e =>
    {
      if (e)
      {
        const param = e.trim().split('=');
        (args as any)[param[0]] = param[1]?.trim()
      }
    })

    let infoList = args.ignoreInfo.split(';')
      .map(param => param.trim().toLowerCase())
      .filter(e => e !== '')
    if(infoList.length == 0)
    {
      infoList = Object.keys(plugin.settings.hiddenInfoTicker)
      .filter(e => e !== '' && plugin.settings.hiddenInfoTicker[e])
      .map(param => param.trim().toLowerCase())
    }

    args.imgPath = normalizePath(args.imgPath);
    const imgName = args.imgPath.split('/').slice(-1)[0]
    const elCanvas = el.createDiv({
      cls: 'ob-gallery-info-block',
      attr: { style: 'width: 100%; height: auto; float: left' }
    })

    let imgTFile = vault.getAbstractFileByPath(args.imgPath)
    let imgURL = vault.adapter.getResourcePath(args.imgPath)

    // Handle problematic arg
    if(!args.imgPath)
    {
      MarkdownRenderer.render(plugin.app, GALLERY_INFO_USAGE, elCanvas, '/', plugin)
      return;
    }

    const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);

    if (!imgTFile)
    {
      const found = await searchForFile(args.imgPath, plugin);

      if(found.length == 0)
      {
        MarkdownRenderer.render(plugin.app,GALLERY_INFO_USAGE, elCanvas, '/', plugin)
        return;
      }
      
      if(found.length == 1)
      {
        // set file and path for current usage
        imgTFile = vault.getAbstractFileByPath(found[0])
        imgURL = vault.adapter.getResourcePath(found[0])

        // replace file path for future usage
        if (view) 
        {
          for(let i = 0; i < view.editor.lineCount(); i++)
          {
            let line = view.editor.getLine(i);
            if(line.contains(args.imgPath))
            {
              const from: EditorPosition = {line: i, ch: line.indexOf(args.imgPath)};
              const to: EditorPosition = {line: i, ch: line.indexOf(args.imgPath)+args.imgPath.length};
              view.editor.replaceRange(found[0], from, to);
            }
          }
        }
      }
      else
      {
        // too many options, tell the user about it
        let output = "### File path not found. Were you looking for one of these?\n"
        for(let i = 0; i < found.length; i++)
        {
          output += "- "+found[i]+"\n";
        }
        
        MarkdownRenderer.render(plugin.app,output, elCanvas, '/', plugin)
        return;
      }
    }



    let measureEl, isVideo
    let hexList: string[] = [];
    // Get image dimensions
    if (imgTFile.path.match(VIDEO_REGEX))
    {
      measureEl = document.createElement('video')
      measureEl.src = imgURL
      isVideo = true
    } 
    else
    {
      measureEl = new Image()
      measureEl.src = imgURL;
      
      if(Platform.isDesktopApp)
      {
        let colors = await extractColors(measureEl, EXTRACT_COLORS_OPTIONS)
        
        for(let i = 0; i < colors.length; i++)
        {
          hexList.push(colors[i].hex);
        }
      }
      
      isVideo = false
    }

    // Handle disabled img info functionality or missing info block
    const imgInfo = await getImgInfo(imgTFile.path, metadata, plugin, false)
    let imgTags = null

    let imgInfoCache = null
    if (imgInfo)
    {
      // add colors if we got them
      if(hexList.length > 0)
      {
          await plugin.app.fileManager.processFrontMatter(imgInfo, frontmatter => {
          if (frontmatter.Palette && frontmatter.Palette.length > 0) 
          { 
            return;
          }
          frontmatter.Palette = hexList
        });
      }

      imgInfoCache = metadata.getFileCache(imgInfo)
      if (imgInfoCache)
      {
        imgTags = getAllTags(imgInfoCache)
      }
    }

    const imgLinks: Array<{path : string, name: string}> = []
    const infoLinks: Array<{path : string, name: string}> = []
    vault.getMarkdownFiles().forEach(mdFile =>
    {
      metadata.getFileCache(mdFile)?.links?.forEach(link =>
      {
        if (link.link === args.imgPath || link.link === imgName)
        {
          imgLinks.push({ path: mdFile.path, name: mdFile.basename })
        }
        if (link.link === imgInfo.path || link.link === imgInfo.name)
        {
          infoLinks.push({ path: mdFile.path, name: mdFile.basename })
        }
      })
      metadata.getFileCache(mdFile)?.embeds?.forEach(link =>
        {
          if (link.link === args.imgPath || link.link === imgName)
          {
            imgLinks.push({ path: mdFile.path, name: mdFile.basename })
          }
          if (link.link === imgInfo.path || link.link === imgInfo.name)
          {
            infoLinks.push({ path: mdFile.path, name: mdFile.basename })
          }
        })
    });

    const frontmatter: FrontMatterCache = imgInfoCache?.frontmatter ?? []
    
    if(hexList.length == 0)
    {
      if(frontmatter["Palette"])
      hexList = frontmatter["Palette"];
    }

    let width, height
    const img = measureEl as HTMLImageElement
    if(img)
    {
      width = img.naturalWidth;
      height = img.naturalHeight;
    }

    if (imgTFile instanceof TFile && EXTENSIONS.contains(imgTFile.extension))
    {
      const info = new GalleryInfo(elCanvas, plugin);
      info.imgFile = imgTFile;
      info.imgInfo = imgInfo;
      info.width = width;
      info.height = height;
      info.dimensions = measureEl as HTMLVideoElement;
      info.colorList = hexList;
      info.tagList = imgTags;
      info.isVideo = isVideo;
      info.imgLinks = imgLinks;
      info.infoLinks = infoLinks;
      info.frontmatter = frontmatter;
      info.infoList = infoList;
      
      info.updateDisplay();
    }
  }
}
