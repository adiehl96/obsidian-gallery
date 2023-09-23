import type { App } from 'obsidian'
import { TFolder, TFile, normalizePath, Notice, Platform } from 'obsidian'
import type GalleryTagsPlugin from './main'
import { ExifData, ExifParserFactory } from 'ts-exif-parser'
import { extractColors, type FinalColor } from '../node_modules/extract-colors'
import { EXTENSIONS, EXTRACT_COLORS_OPTIONS, VIDEO_REGEX, DEFAULT_TEMPLATE } from './TechnicalFiles/Constants'

export type ImageResources = Record<string, string>

export const scaleColor = (color: string, percent: number) : string =>
{
  let rcode = color.substring(1,3);
  let gcode = color.substring(3,5);
  let bcode = color.substring(5,7);
  let r = parseInt(rcode, 16);
  let g = parseInt(gcode, 16);
  let b = parseInt(bcode, 16);

  r *= percent;
  g *= percent;
  b *= percent;

  rcode = Math.ceil(Math.clamp(r,0,255)).toString(16).padStart(2, '0');
  gcode = Math.ceil(Math.clamp(g,0,255)).toString(16).padStart(2, '0');
  bcode = Math.ceil(Math.clamp(b,0,255)).toString(16).padStart(2, '0');
  return "#"+rcode+gcode+bcode
}

/**
 * Return initial img info file content
 * @param imgPath - Relative vault path of related image
 */
const initializeInfo = (template: string, imgPath: string, imgName: string): string =>
{
  if(template == null || template.trim() == "")
  {
    template = DEFAULT_TEMPLATE;
  }
  const uri = preprocessUri(imgPath);
  const infoBlock = "```gallery-info\nimgPath="+imgPath+"\n```";
  const link = "["+imgName+"]("+uri+")";
  const embed = "![]("+uri+")";
  let final = template;

  final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(L|l)(I|i)(N|n)(K|k)\s*%>/g), link);
  final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(E|e)(M|m)(B|b)(E|e)(D|d)\s*%>/g), embed);
  final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(I|i)(N|n)(F|f)(O|o)\s*%>/g), infoBlock);
  final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(U|u)(R|r)(I|i)\s*%>/g), uri);
  final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(P|p)(A|a)(T|t)(H|h)\s*%>/g), imgPath);
  final = final.replaceAll(new RegExp(/<%\s*(I|i)(M|m)(G|g)\s*(N|n)(A|a)(M|m)(E|e)\s*%>/g), imgName);

  return final;
}

export const preprocessUri = (original: string): string =>
{
  const uri = original.replaceAll(' ', '%20');

  return uri;
}
export const unProcessUri = (original: string): string =>
{
  const uri = original.replaceAll('%20', ' ');

  return uri;
}

/**
 * Open the search window to a query. 
 * !!!This uses unsafe internal references and may break at any time!!!
 * @param someSearchQuery text of the query
 * @param app ref to the app
 */
export const getSearch = async (someSearchQuery: string, app: App) : Promise<void> => {
  //@ts-ignore
  app.internalPlugins.getPluginById('global-search').instance.openGlobalSearch(someSearchQuery);
}

/**
 * Figures out if the element is partially offscreen
 * @param el element to check
 * @returns 
 */
export const offScreenPartial = function(el:HTMLElement) : boolean {
  var rect = el.getBoundingClientRect();
  const a = (rect.x + rect.width) > window.innerWidth
  const b = (rect.y + rect.height) > window.innerHeight
  const c = rect.x < 0
  const d = rect.y < 0
  return a || b || c || d;
};

export const offscreenFull = function(el:HTMLElement) : boolean {
  var rect = el.getBoundingClientRect();
  return (
           (rect.x + rect.width) < 0 
             || (rect.y + rect.height) < 0
             || (rect.x > window.innerWidth 
              || rect.y > window.innerHeight)
         );
};

/**
 * Return Image Info File, if not present create it
 * @param imgPath - Obsidian Vault Image relative path
 * @param vault - Vault handler
 * @param metadata - Vaulat metadata handler
 * @param plugin - Gallery plugin handler
 */
export const getImgInfo = async (imgPath: string, plugin: GalleryTagsPlugin, create: boolean): Promise<TFile|null> =>
{
  if(plugin.settings.imgDataFolder == null)
  {
    return null;
  }

  if(!imgPath || imgPath == "")
  {
    return
  }

  if(imgPath.contains("app://"))
  {
    imgPath = unProcessUri(imgPath);
    
    const files = plugin.app.vault.getFiles();
    for (let i = 0; i < files.length; i++) 
    {
      if(imgPath.contains(files[i].path))
      {
        imgPath = files[i].path;
        break;
      }
    }
  }
  
  let infoFile = null
  const imgName = imgPath.split('/').slice(-1)[0]
  const infoFolder = plugin.app.vault.getAbstractFileByPath(plugin.settings.imgDataFolder)
  const infoFileList: string[] = []
  if (infoFolder instanceof TFolder)
  {
    infoFolder.children?.forEach(info =>
    {
      if (info instanceof TFile)
      {
        infoFileList.push(info.basename)
        const fileCache = plugin.app.metadataCache.getFileCache(info)
        const link:string = fileCache?.frontmatter?.targetImage
        if (link === imgName || imgPath.contains(link))
        {
          infoFile = info
        }
      }
    })

    if (!infoFile && create)
    {
			infoFile = await createMetaFile(imgPath, plugin);
    }

    return infoFile 
  }

  // Specified Resources folder does not exist
  return null
};

export const createMetaFile = async (imgPath:string,plugin:GalleryTagsPlugin): Promise<TFile> =>
{      
  // Info File does not exist, Create it
  let counter = 1
  const imgName = imgPath.split('/').slice(-1)[0]
  let fileName = imgName.substring(0, imgName.lastIndexOf('.'))
  let filepath = normalizePath(`${plugin.settings.imgDataFolder}/${fileName}.md`);
  let infoFile: TFile;

  while (infoFile = (plugin.app.vault.getAbstractFileByPath(filepath )as TFile))
  {
    let imgLink = await getimageLink(infoFile as TFile, plugin);
    if(imgLink == imgPath)
    {
      return infoFile;
    }
    filepath = normalizePath(`${plugin.settings.imgDataFolder}/${fileName}_${counter}.md`);
    counter++;
  }

  
  const templateTFile = plugin.app.vault.getAbstractFileByPath(normalizePath(plugin.settings.imgmetaTemplatePath+".md")) as TFile;
  let template = DEFAULT_TEMPLATE;
  if(templateTFile)
  {
    template = await plugin.app.vault.read(templateTFile);
  }

  plugin.embedQueue[filepath] = imgPath;

  try
  {
    return await plugin.app.vault.create(filepath, initializeInfo(template, imgPath, imgName));
  }
  catch(e)
  {
    infoFile = plugin.app.vault.getAbstractFileByPath(filepath) as TFile;
    if(infoFile)
    {
      return infoFile;
    }
    console.warn(`Unable to get meta file for '${imgPath}', file exists at path '${filepath}' but cannot be read at this time.`);
    new Notice(`Unable to get meta file for '${imgPath}', file exists at path '${filepath}' but cannot be read at this time.`);
  }
}

export const getimageLink = async (info: TFile, plugin: GalleryTagsPlugin) : Promise<string> =>
{
  let imgLink: string;
  if (info instanceof TFile)
  {
    const fileCache = plugin.app.metadataCache.getFileCache(info)
    if(fileCache.frontmatter && fileCache.frontmatter.targetImage && fileCache.frontmatter.targetImage.length > 0)
    {
      imgLink = fileCache.frontmatter.targetImage
    }
    else
    {
      // find the info block and get the text from there
      const cache = plugin.app.metadataCache.getFileCache(info);
      if(cache.frontmatter && !(cache.frontmatter.targetImage && cache.frontmatter.targetImage.length > 0))
      {
        const infoContent = await plugin.app.vault.read(info);
        const match = /imgPath=.+/.exec(infoContent)
        if(match)
        {
          imgLink = match[0].trim().substring(8);
          imgLink = normalizePath(imgLink);
  
          await plugin.app.fileManager.processFrontMatter(info, async (frontmatter) => 
          {
            frontmatter.targetImage = imgLink;
          });
        }
      }
    }
  }

  return imgLink;
}

/**
 * Attempt to scrape the file for tags and add them to the meta
 * @param imgTFile file to scrape
 * @param infoTFile meta file to add tags to
 * @param plugin reference to the plugin
 */
export const addEmbededTags = async (imgTFile: TFile, infoTFile: TFile, plugin: GalleryTagsPlugin): Promise<boolean> =>
{
  let keywords: string[];
  const data = plugin.app.metadataCache.getFileCache(infoTFile)
  if(!data)
  {
    return false;
  }

  if(!plugin.settings.skipMetadataOverwrite || !(data.frontmatter && data.frontmatter.tags && data.frontmatter.tags.length > 0 ))
  {
    keywords = await getJpgTags(imgTFile, plugin);
  }
  const shouldColor =(!imgTFile.path.match(VIDEO_REGEX) 
  && Platform.isDesktopApp
  && !(data.frontmatter && data.frontmatter.Palette && data.frontmatter.Palette.length > 0))
  
  const shouldLink = !(data.frontmatter && data.frontmatter.targetImage && data.frontmatter.targetImage.length > 0)
  let colors: FinalColor[]

  if(shouldColor)
  {
    const measureEl = new Image();
    measureEl.src = plugin.app.vault.adapter.getResourcePath(imgTFile.path);

    colors = await extractColors(measureEl, EXTRACT_COLORS_OPTIONS)
  }

  if(shouldLink || keywords || shouldColor)
  {
    await plugin.app.fileManager.processFrontMatter(infoTFile, async (frontmatter) => 
    {
      if(shouldLink)
      {
        frontmatter.targetImage = imgTFile.path;
      }

      if(keywords)
      {
        let tags = frontmatter.tags ?? []
        if (!Array.isArray(tags)) 
        { 
          tags = [tags]; 
        }
        let newTags = false;
        for (let i = 0; i < keywords.length; i++) 
        {
          const tag = keywords[i].trim();
          if(tag === '')
          {
            continue;
          }
          if(tags.contains(tag))
          {
            continue;
          }
          
          newTags = true;
          tags.push(tag);
        }
        if(newTags)
        {
          frontmatter.tags = tags;
        }
      }
      
      // Get image colors
      if (shouldColor)
      {
        const hexList: string[] = [];
        
        for(let i = 0; i < colors.length; i++)
        {
          hexList.push(colors[i].hex);
        }
        
        frontmatter.Palette = hexList;
      }
    });
    return true;
  }

  return false;
}

const getJpgTags = async (imgTFile: TFile, plugin: GalleryTagsPlugin): Promise<string[]> =>
{
  if(!imgTFile)
  {
    return null;
  }

  let tagInfo: ExifData;

  try
  {
    const bits = await plugin.app.vault.readBinary(imgTFile as TFile)
    const parser = ExifParserFactory.create(bits);
    tagInfo = parser.parse();
  }
  catch(e: any)
  {
    if(e instanceof Error)
    {
      new Notice(e.message)
    }
    else
    {
      new Notice(e)
    }
  }

  if(!tagInfo || !tagInfo.tags || !tagInfo.tags.XPKeywords)
  {
    return null;
  }

  let found = ""
  if(Array.isArray(tagInfo.tags.XPKeywords) )
  {
    var enc = new TextDecoder("utf-8");
    //@ts-ignore
    const tagbinary = new Uint8Array(tagInfo.tags.XPKeywords).buffer
    found = enc.decode(tagbinary)
    //new Notice("utf-8: "+found)
  }
  else
  {
    found = tagInfo.tags.XPKeywords;
    //new Notice("string: "+found)
  }

  if(found.contains("\0"))
  {
    var enc = new TextDecoder("utf-16");
    //@ts-ignore
    const tagbinary = new Uint16Array(tagInfo.tags.XPKeywords).buffer
    found = enc.decode(tagbinary)
    //new Notice("utf-16: "+found)
  }

  if(found.contains("\0"))
  {
    found = found.replaceAll("\0","")
    //new Notice("utf-32: "+found)
  }

  found = found.replaceAll(" ","_")

  return found.split(/[;,]/);
}

/**
 * used to find potential correct links for when a path has broken
 * @param path old path that is broken
 * @param plugin plugin ref
 * @returns list of file paths that match the file name
 */
export const searchForFile = async (path: string, plugin: GalleryTagsPlugin): Promise<string[]> =>
{
  const foundPaths: string[] = []
  const vaultFiles: TFile[] = plugin.app.vault.getFiles();
  const fileName: string = path.substring(path.lastIndexOf('/'));

  for (const file of vaultFiles)
  {
    if (EXTENSIONS.contains(file.extension.toLowerCase()) && file.path.contains(fileName) )
    {
      foundPaths.push(file.path);
    }
  }

  return foundPaths;
}

export const setLazyLoading = () =>
{
  const lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  let options = {
    root: document.querySelector("ob-gallery-display"),
    // rootMargin: "0px",
    // threshold: 1.0,
  };
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target as HTMLImageElement;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          observer.unobserve(lazyImage);
        }
      });
    }, options);

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to event handlers here
  }
}

export const updateFocus = (imgEl: HTMLImageElement, videoEl: HTMLVideoElement, src: string, isVideo: boolean): void =>
{
  if (isVideo)
  {
    // hide focus image div
    imgEl.style.setProperty('display', 'none')
    // Show focus video div
    videoEl.style.setProperty('display', 'block')
    // Clear Focus image
    imgEl.src = ''
    // Set focus video
    videoEl.src = src
    return;
  }

  // Show focus image div
  imgEl.style.setProperty('display', 'block')
  // Hide focus video div
  videoEl.style.setProperty('display', 'none')
  // Clear Focus video
  videoEl.src = ''
  // Set focus image
  imgEl.src = src
};
