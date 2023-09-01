import type { Vault, MetadataCache, FrontMatterCache } from 'obsidian'
import { MarkdownRenderer, TFile, getAllTags, Platform, Notice } from 'obsidian'
import { extractColors } from '../node_modules/extract-colors'
import type { GalleryBlockArgs, InfoBlockArgs } from './utils'
import
  {
    EXTENSIONS, GALLERY_DISPLAY_USAGE, EXTRACT_COLORS_OPTIONS, OB_GALLERY_INFO,
    VIDEO_REGEX,
    getImageResources,
    getImgInfo, updateFocus, splitcolumns
  } from './utils'
import { GalleryInfoView } from './view'
import type GalleryPlugin from './main'
import ImageGrid from './svelte/ImageGrid.svelte'
import Gallery from './svelte/Gallery.svelte'
import GalleryInfo from './svelte/GalleryInfo.svelte'

export class GalleryProcessor
{
  async galleryDisplay(source: string, el: HTMLElement, vault: Vault, metadata: MetadataCache, plugin: GalleryPlugin)
  {
    const args: GalleryBlockArgs = {
      type: 'grid',
      path: '',
      name: '',
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
      MarkdownRenderer.renderMarkdown(GALLERY_DISPLAY_USAGE, elCanvas, '/', plugin)
      return;
    }

    const imgResources = await getImageResources(args.path, args.name, "", true, vault.getFiles(), vault.adapter, plugin)
    let imgList = Object.keys(imgResources)

    if (args.reverseOrder === 'true')
    {
      imgList = imgList.reverse()
    }

    if (args.customList)
    {
      imgList = args.customList.split(' ').map(i => parseInt(i)).filter(value => !Number.isNaN(value)).map(i => imgList[i])
    }

    if (args.type === 'grid')
    {
      const [columns, columnWidth] = splitcolumns(imgList, elCanvas, args.imgWidth)

      new ImageGrid({
        props: {
          columns: columns,
          maxColumnWidth: columnWidth
        },
        target: elCanvas
      })

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
          imgFocusIndex = imgList.indexOf(imgPath)
          imageFocusEl.style.setProperty('display', 'block')
          updateFocus(focusImage, focusVideo, imgList[imgFocusIndex], false)
        }

        if (event.target instanceof HTMLVideoElement)
        {
          // Read video info
          const imgPath = event.target.src
          imgFocusIndex = imgList.indexOf(imgPath)
          imageFocusEl.style.setProperty('display', 'block')
          // Save clicked video info to set it back later
          pausedVideo = event.target
          pausedVideoUrl = pausedVideo.src
          // disable clicked video
          pausedVideo.src = ''
          updateFocus(focusImage, focusVideo, imgList[imgFocusIndex], true)
        }
      })

      elCanvas.addEventListener('contextmenu', async (e) =>
      {
        if (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement)
        {
          // Open image file
          const file = vault.getAbstractFileByPath(imgResources[e.target.src])
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
              imgFocusIndex = imgList.length - 1
            }
            if (imgList[imgFocusIndex].match(VIDEO_REGEX))
            {
              updateFocus(focusImage, focusVideo, imgList[imgFocusIndex], true)
            } else
            {
              updateFocus(focusImage, focusVideo, imgList[imgFocusIndex], false)
            }
            break;
          case 'ArrowRight':
            imgFocusIndex++
            if (imgFocusIndex >= imgList.length)
            {
              imgFocusIndex = 0
            }
            if (imgList[imgFocusIndex].match(VIDEO_REGEX))
            {
              updateFocus(focusImage, focusVideo, imgList[imgFocusIndex], true)
            } else
            {
              updateFocus(focusImage, focusVideo, imgList[imgFocusIndex], false)
            }
            break;
        }
      }, false)
    }

    if (args.type === 'active-thumb')
    {
      new Gallery({
        props: {
          imgList,
          width: args.imgWidth / 50,
          fillFree: true
        },
        target: elCanvas
      })
    }
  }

  async galleryImageInfo(source: string, el: HTMLElement, vault: Vault, metadata: MetadataCache, plugin: GalleryPlugin)
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

    const infoList = args.ignoreInfo.split(';').map(param => param.trim().toLowerCase()).filter(e => e !== '')
    const imgName = args.imgPath.split('/').slice(-1)[0]
    const elCanvas = el.createDiv({
      cls: 'ob-gallery-info-block',
      attr: { style: 'width: 100%; height: auto; float: left' }
    })

    const imgTFile = vault.getAbstractFileByPath(args.imgPath)
    const imgURL = vault.adapter.getResourcePath(args.imgPath)

    // Handle problematic arg
    if (!args.imgPath || !imgTFile)
    {
      MarkdownRenderer.renderMarkdown('GALLERY_INFO_USAGE', elCanvas, '/', plugin)
      return;
    }

    let measureEl, isVideo
    let hexList: string[] = [];
    // Get image dimensions
    if (imgURL.match(VIDEO_REGEX))
    {
      measureEl = document.createElement('video')
      isVideo = true
    } else
    {
      measureEl = new Image()
      if(Platform.isDesktopApp)
      {
        let colors = await extractColors(imgURL, EXTRACT_COLORS_OPTIONS)
        
        for(let i = 0; i < colors.length; i++)
        {
          hexList.push(colors[i].hex);
        }
      }
      
      isVideo = false
    }

    measureEl.src = imgURL

    // Handle disabled img info functionality or missing info block
    const imgInfo = await getImgInfo(imgTFile.path, vault, metadata, plugin, false)
    let imgTags = null

    let imgInfoCache = null
    if (imgInfo)
    {
      // await plugin.app.fileManager.processFrontMatter(imgInfo, frontmatter => {
      //   let tags = frontmatter.tags ?? []
      //   if (!Array.isArray(tags)) { tags = [tags] }
      //   tags.push("new/tag")
      //   frontmatter.tags = tags
      // })
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

    var newTag;
    if (imgTFile instanceof TFile && EXTENSIONS.contains(imgTFile.extension))
    {
      new GalleryInfo({
        props: {
          name: imgTFile.basename,
          path: imgTFile.path,
          extension: imgTFile.extension,
          date: new Date(imgTFile.stat.ctime),
          dimensions: measureEl,
          size: imgTFile.stat.size / 1000000,
          colorList: hexList,
          tagList: imgTags,
          isVideo,
          imgLinks,
          frontmatter,
          infoList
        },
        target: elCanvas
      })
    }

    elCanvas.onClickEvent(async (event) =>
    {
      if (event.button === 2)
      {
        // Open image info view in side panel
        const workspace = plugin.app.workspace
        workspace.detachLeavesOfType(OB_GALLERY_INFO)
        await workspace.getRightLeaf(false).setViewState({ type: OB_GALLERY_INFO })
        workspace.revealLeaf(
          await workspace.getLeavesOfType(OB_GALLERY_INFO)[0]
        );
        const infoView = workspace.getLeavesOfType(OB_GALLERY_INFO)[0]?.view
        if (infoView instanceof GalleryInfoView && imgInfo)
        {
          infoView.infoFile = imgInfo
          infoView.editor.setValue(await vault.cachedRead(imgInfo))
          infoView.render()
        }
      }
    })
  }
}
