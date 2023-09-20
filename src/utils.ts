import type { MetadataCache, App } from 'obsidian'
import { TFolder, TFile, normalizePath, Notice, Platform } from 'obsidian'
import type GalleryTagsPlugin from './main'
import { ExifData, ExifParserFactory } from 'ts-exif-parser'
import { extractColors, type FinalColor } from '../node_modules/extract-colors'

export interface GallerySettings
{
  imgDataFolder: string | null
  galleryLoadPath: string
  imgmetaTemplatePath: string | null
  width: number
  useMaxHeight: boolean
  maxHeight: number
  hiddenInfo: string | null
  filterStartOpen: boolean
}

export type ImageResources = Record<string, string>

export interface ImageDimensions
{
  width: number
  height: number
}

export interface GalleryBlockArgs
{
  type: string
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
  reverseOrder: string
  customList: string
  random: number
}

export interface InfoBlockArgs
{
  imgPath: string
  ignoreInfo: string
}

export const SETTINGS: GallerySettings = {
  imgDataFolder: null,
  galleryLoadPath: '/',
  imgmetaTemplatePath: null,
  width: 400,
  useMaxHeight: false,
  maxHeight: 400,
  hiddenInfo: "tags;palette",
  filterStartOpen: false
}

export const EXTRACT_COLORS_OPTIONS = {
  pixels: 20000,
  distance: 0.2,
  saturationImportance: 0.2,
  splitPower: 10,
  colorValidator: (red: number, green: number, blue: number, alpha = 255) => alpha > 250
}

export const EXTENSIONS = ['png', 'jpg', 'jpeg', "webp", "gif", "webm", 'mp4']

export const VIDEO_REGEX = new RegExp('.*\\.(mp4|webm)($|\\?)')

export const OB_GALLERY = 'ob-gallery'

export const OB_GALLERY_INFO = 'ob-gallery-info'

export const galleryIcon = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="images" class="svg-inline--fa fa-images fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M480 416v16c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V176c0-26.51 21.49-48 48-48h16v208c0 44.112 35.888 80 80 80h336zm96-80V80c0-26.51-21.49-48-48-48H144c-26.51 0-48 21.49-48 48v256c0 26.51 21.49 48 48 48h384c26.51 0 48-21.49 48-48zM256 128c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-96 144l55.515-55.515c4.686-4.686 12.284-4.686 16.971 0L272 256l135.515-135.515c4.686-4.686 12.284-4.686 16.971 0L512 208v112H160v-48z"></path></svg>'

export const gallerySearchIcon = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="search" class="svg-inline--fa fa-search fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>'

export const GALLERY_DISPLAY_USAGE = `
e.g. Input:

\`\`\`type=active-thumb
path=Weekly
name=.*Calen
imgWidth=400
divWidth=70
divAlign=left
reverseOrder=false
customList=5 10 2 4
\`\`\`

----

- **Argument Info:**<br>
- **type:** specify display type. Possible values \`grid\`, \`active-thumb\`<br>
- **path:** vault path to display images from. Regex expression<br>
- **imgWidth**: image width in pixels<br>
- **divWidth**: div container in %<br>
- **divAlign**: div alignment. Possible values \`left\`, \`right\`<br>
- **reverseOrder**: reverse the display order of images. Possible values \`true\`, \`false\`<br>
- **customList**: specify image indexes to display in the passed order<br>

----

Please Check Release Notes for plugin changes:<br>
https://github.com/Darakah/obsidian-gallery#release-notes
`

export const GALLERY_INFO_USAGE = `
e.g. Input:

\`\`\`
imgPath=Resources/Images/Image_example_1.png
ignoreInfo=Name;tags;size;backlinks
\`\`\`

----

- Block takes a single argument which is the \`PATH\` of the image.
- Path is the relative path of the file withing the obsidian vault.
- Make sure the image exists!!
- It is case sensitive!
- IgnoreInfo is a list of fields NOT to display(if not included uses Default Hidden Info setting)

----

Please Check Release Notes for plugin changes:<br>
https://github.com/TomNCatz/obsidian-gallery#release-notes
`

export const GALLERY_RESOURCES_MISSING = `
<div class="gallery-resources-alert">
  <strong>Missing or Unspecified Image Information Resources folder</strong>
</div>

Please make sure that a Valid Folder is specified in the settings for the plugin to use to store image information notes!
`

const defaultTemplate = '---\ntags:\n---\n<%IMGEMBED%>\n<%IMGINFO%>\n%% Description %%\n'


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
    template = defaultTemplate;
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
export const getImgInfo = async (imgPath: string, metadata: MetadataCache, plugin: GalleryTagsPlugin, create: boolean): Promise<TFile|null> =>
{
  if(plugin.settings.imgDataFolder == null)
  {
    return null;
  }

  if(!imgPath || imgPath == "")
  {
    return
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
        const fileCache = metadata.getFileCache(info)
        const links = fileCache?.embeds
        links?.forEach(link =>
        {
          if (link.link === imgName || link.link === imgPath)
          {
            infoFile = info
          }
        })
      }
    })

    if (!infoFile && create)
    {
			infoFile = createMetaFile(imgPath, plugin);
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
			while (plugin.app.vault.getAbstractFileByPath(filepath))
			{
				filepath = normalizePath(`${plugin.settings.imgDataFolder}/${fileName}_${counter}.md`);
				counter++;
			}

      
      const templateTFile = plugin.app.vault.getAbstractFileByPath(normalizePath(plugin.settings.imgmetaTemplatePath+".md")) as TFile;
      let template = defaultTemplate;
      if(templateTFile)
      {
        template = await plugin.app.vault.read(templateTFile);
      }

      await plugin.app.vault.create(filepath, initializeInfo(template, imgPath, imgName));
      // TODO: this waits a moment for the metadatacache to catch up with the new backlinks, but boy does it feel gross. Need to find out if there's another way to do this
      await new Promise(f => setTimeout(f, 100));
      const infoFile = plugin.app.vault.getAbstractFileByPath(filepath) as TFile

      
      const imgTFile = plugin.app.vault.getAbstractFileByPath(imgPath) as TFile
      await addEmbededTags(imgTFile, infoFile, plugin);

      return infoFile;
}

/**
 * Attempt to scrape the file for tags and add them to the meta
 * @param imgTFile file to scrape
 * @param infoTFile meta file to add tags to
 * @param plugin reference to the plugin
 */
export const addEmbededTags = async (imgTFile: TFile, infoTFile: TFile, plugin: GalleryTagsPlugin): Promise<boolean> =>
{
  const keywords: string[] = await getJpgTags(imgTFile, plugin);
  const data = plugin.app.metadataCache.getFileCache(infoTFile)
  if(!data)
  {
    return false;
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
