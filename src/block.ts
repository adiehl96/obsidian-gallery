import type { Vault, MetadataCache, FrontMatterCache, EditorPosition } from 'obsidian'
import { MarkdownRenderer, TFile, getAllTags, Platform, MarkdownView, normalizePath } from 'obsidian'
import { extractColors } from '../node_modules/extract-colors'
import type { GalleryBlockArgs, InfoBlockArgs } from './utils'
import
  {
    EXTENSIONS, GALLERY_DISPLAY_USAGE, EXTRACT_COLORS_OPTIONS, OB_GALLERY_INFO,
    VIDEO_REGEX,
    getImgInfo, updateFocus, GALLERY_INFO_USAGE, searchForFile
  } from './utils'
import { GalleryInfoView } from './view'
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
      divWidth: 100,
      divAlign: 'left',
      reverseOrder: 'false',
      customList: ''
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
      attr: { style: `width: ${args.divWidth}%; height: auto; float: ${args.divAlign}` }
    })

    // Handle problematic arguments
    if (!args.path || !args.type)
    {
      MarkdownRenderer.render(plugin.app, GALLERY_DISPLAY_USAGE, elCanvas, '/', plugin)
      return;
    }
    
    
    const imagesContainer = elCanvas.createEl('ul')
    const imageGrid = new ImageGrid(imagesContainer, plugin);
    imageGrid.path = args.path;
    imageGrid.name = args.name;
    imageGrid.tag = args.tags;
    imageGrid.reverse = args.reverseOrder === 'true';
    imageGrid.maxWidth = args.imgWidth;
    imageGrid.exclusive = args.exclusive === 'true';
    imageGrid.matchCase = args.matchCase === 'true';
    imageGrid.reverse = args.reverseOrder === 'true';
    await imageGrid.updateData();

    if (args.customList)
    {
      imageGrid.imgList = args.customList.split(' ').map(i => parseInt(i)).filter(value => !Number.isNaN(value)).map(i => imageGrid.imgList[i])
    }

    if (args.type === 'grid')
    {
      imageGrid.updateDisplay();
      plugin.onResize = () =>
      {
        imagesContainer.empty();
        imageGrid.updateDisplay();
      }
      
      const imageFocusEl = elCanvas.createDiv({ cls: 'ob-gallery-image-focus' })
      const focusElContainer = imageFocusEl.createDiv({ attr: { class: 'focus-element-container' } });
      const focusImage = focusElContainer.createEl('img', { attr: { style: 'display: none;' } });
      const focusVideo = focusElContainer.createEl('video', { attr: { controls: 'controls', src: ' ', style: 'display: none; margin: auto;' } });
      let pausedVideo : HTMLVideoElement, pausedVideoUrl : string
      let imgFocusIndex = 0

      elCanvas.onClickEvent((event) =>
      {
        event.stopPropagation()
        const currentMode = imageFocusEl.style.getPropertyValue('display')
        if (currentMode == 'block')
        {
          imageFocusEl.style.setProperty('display', 'none')
          // Clear Focus video
          focusVideo.src = ''
          // Clear Focus image
          focusImage.src = ''
          // Set Video Url back to disabled grid video
          if (pausedVideo)
          {
            pausedVideo.src = pausedVideoUrl
          }
          // Hide focus image div
          focusImage.style.setProperty('display', 'none')
          // Hide focus video div
          focusVideo.style.setProperty('display', 'none')
          return;
        }

        if (event.target instanceof HTMLImageElement)
        {
          // Read New image info
          const imgPath = event.target.src
          imgFocusIndex = imageGrid.imgList.indexOf(imgPath)
          imageFocusEl.style.setProperty('display', 'block')
          updateFocus(focusImage, focusVideo, imageGrid.imgList[imgFocusIndex], false)
        }

        if (event.target instanceof HTMLVideoElement)
        {
          // Read video info
          const imgPath = event.target.src
          imgFocusIndex = imageGrid.imgList.indexOf(imgPath)
          imageFocusEl.style.setProperty('display', 'block')
          // Save clicked video info to set it back later
          pausedVideo = event.target
          pausedVideoUrl = pausedVideo.src
          // disable clicked video
          pausedVideo.src = ''
          updateFocus(focusImage, focusVideo, imageGrid.imgList[imgFocusIndex], true)
        }
      })

      elCanvas.addEventListener('contextmenu', async (e) =>
      {
        if (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement)
        {
          // Open image file
          const file = vault.getAbstractFileByPath(imageGrid.imgResources[e.target.src])
          if (file instanceof TFile)
          {
            plugin.app.workspace.getUnpinnedLeaf().openFile(file)
          }
        }
      })

      document.addEventListener('keyup', (event) =>
      {
        if (imageFocusEl.style.getPropertyValue('display') != 'block')
        {
          return;
        }

        switch (event.key)
        {
          case 'ArrowLeft':
            imgFocusIndex--
            if (imgFocusIndex < 0)
            {
              imgFocusIndex = imageGrid.imgList.length - 1
            }
            if (imageGrid.imgList[imgFocusIndex].match(VIDEO_REGEX))
            {
              updateFocus(focusImage, focusVideo, imageGrid.imgList[imgFocusIndex], true)
            } else
            {
              updateFocus(focusImage, focusVideo, imageGrid.imgList[imgFocusIndex], false)
            }
            break;
          case 'ArrowRight':
            imgFocusIndex++
            if (imgFocusIndex >= imageGrid.imgList.length)
            {
              imgFocusIndex = 0
            }
            if (imageGrid.imgList[imgFocusIndex].match(VIDEO_REGEX))
            {
              updateFocus(focusImage, focusVideo, imageGrid.imgList[imgFocusIndex], true)
            } else
            {
              updateFocus(focusImage, focusVideo, imageGrid.imgList[imgFocusIndex], false)
            }
            break;
        }
      }, false)
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

    let infoList = args.ignoreInfo.split(';').map(param => param.trim().toLowerCase()).filter(e => e !== '')
    if(infoList.length == 0)
    {
      infoList = plugin.settings.hiddenInfo.split(';').map(param => param.trim().toLowerCase()).filter(e => e !== '')
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
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);

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
    const imgInfo = await getImgInfo(imgTFile.path, vault, metadata, plugin, false)
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
    vault.getMarkdownFiles().forEach(mdFile =>
    {
      metadata.getFileCache(mdFile)?.embeds?.forEach(link =>
      {
        if (link.link === args.imgPath || link.link === imgName)
        {
          imgLinks.push({ path: mdFile.path, name: mdFile.basename })
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
      info.frontmatter = frontmatter;
      info.infoList = infoList;
      
      info.updateDisplay();
    }

    // TODO: I'm not sure why I'd ever want this and it was causeing bugs
    // elCanvas.onClickEvent(async (event) =>
    // {
    //   if (event.button === 2)
    //   {
    //     // Open image info view in side panel
    //     const workspace = plugin.app.workspace
    //     workspace.detachLeavesOfType(OB_GALLERY_INFO)
    //     await workspace.getRightLeaf(false).setViewState({ type: OB_GALLERY_INFO })
    //     workspace.revealLeaf(
    //       await workspace.getLeavesOfType(OB_GALLERY_INFO)[0]
    //     );
    //     const infoView = workspace.getLeavesOfType(OB_GALLERY_INFO)[0]?.view
    //     if (infoView instanceof GalleryInfoView && imgInfo)
    //     {
    //       infoView.infoFile = imgInfo
    //       infoView.fileContent = await vault.cachedRead(imgInfo)
    //       infoView.render()
    //     }
    //   }
    // })
  }
}
