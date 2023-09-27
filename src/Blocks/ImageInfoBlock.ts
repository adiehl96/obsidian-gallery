import type { FrontMatterCache } from 'obsidian'
import { MarkdownRenderer, TFile, getAllTags, Platform, MarkdownView, normalizePath } from 'obsidian'
import { extractColors } from '../../node_modules/extract-colors'
import
{
  getImageInfo,
  searchForFile
} from '../utils'
import
{
  EXTENSIONS, 
  EXTRACT_COLORS_OPTIONS,
  VIDEO_REGEX,
} from '../TechnicalFiles/Constants'
import type GalleryTagsPlugin from '../main'
import { GalleryInfo } from '../DisplayObjects/GalleryInfo'
import { loc } from '../Loc/Localizer'

export interface InfoBlockArgs
{
  imgPath: string
  ignoreInfo: string
}

export class ImageInfoBlock
{
  async galleryImageInfo(source: string, el: HTMLElement, sourcePath: string, plugin: GalleryTagsPlugin)
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

    // Handle problematic arg
    if(!args.imgPath)
    {
      MarkdownRenderer.render(plugin.app, loc('GALLERY_INFO_USAGE'), elCanvas, '/', plugin)
      return;
    }

    let imgTFile = plugin.app.vault.getAbstractFileByPath(args.imgPath) as TFile;

    if (!imgTFile)
    {
      const found = await searchForFile(args.imgPath, plugin);

      if(found.length == 0)
      {
        MarkdownRenderer.render(plugin.app,loc('GALLERY_INFO_USAGE'), elCanvas, '/', plugin)
        return;
      }
      else
      {
        // too many options, tell the user about it
        let output = loc('IMAGE_PATH_FAILED_FIND_WARNING');
        for(let i = 0; i < found.length; i++)
        {
          output += "- imgPath="+found[i]+"\n";
        }
        
        MarkdownRenderer.render(plugin.app, output, elCanvas, '/', plugin)
        return;
      }
    }

    let imgURL = plugin.app.vault.getResourcePath(imgTFile)
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
    const imgInfo = await getImageInfo(imgTFile.path, false, plugin);
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

      imgInfoCache = plugin.app.metadataCache.getFileCache(imgInfo)
      if (imgInfoCache)
      {
        imgTags = getAllTags(imgInfoCache)
      }
    }

    const imgLinks: Array<{path : string, name: string}> = []
    const infoLinks: Array<{path : string, name: string}> = []
    plugin.app.vault.getMarkdownFiles().forEach(mdFile =>
    {
      plugin.app.metadataCache.getFileCache(mdFile)?.links?.forEach(link =>
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
      plugin.app.metadataCache.getFileCache(mdFile)?.embeds?.forEach(link =>
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
      const info = new GalleryInfo(elCanvas, el.parentElement, plugin);
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
