import type { DataAdapter, Vault, MetadataCache } from 'obsidian'
import { TFolder, TFile, getAllTags } from 'obsidian'
import type GalleryTagsPlugin from './main'

export interface GallerySettings
{
  imgDataFolder: string | null
  galleryLoadPath: string
  imgmetaTemplatePath: string | null
  width: number
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
  imgWidth: number
  divWidth: number
  divAlign: string
  reverseOrder: string
  customList: string
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

export const VIDEO_REGEX = new RegExp('.*\\.(mp4|webm)\\?\\d*$')

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
  const uri = imgPath.replaceAll(' ', '%20');
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

/**
 * Return Image Info File, if not present create it
 * @param imgPath - Obsidian Vault Image relative path
 * @param vault - Vault handler
 * @param metadata - Vaulat metadata handler
 * @param plugin - Gallery plugin handler
 */
export const getImgInfo = async (imgPath: string, vault: Vault, metadata: MetadataCache, plugin: GalleryTagsPlugin, create: boolean): Promise<TFile|null> =>
{
  if(plugin.settings.imgDataFolder == null)
  {
    return null;
  }
  let infoFile = null
  const imgName = imgPath.split('/').slice(-1)[0]
  const infoFolder = vault.getAbstractFileByPath(plugin.settings.imgDataFolder)
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
      // Info File does not exist, Create it
      await plugin.saveSettings()
      let counter = 1
      let fileName = imgName.split('\.')[0]
      while (infoFileList.contains(fileName))
      {
        fileName = `${fileName}_${counter}`
        counter++;
      }

      
      const templateTFile = plugin.app.vault.getAbstractFileByPath(plugin.settings.imgmetaTemplatePath+".md") as TFile;
      let template = defaultTemplate;
      if(templateTFile)
      {
        template = await plugin.app.vault.read(templateTFile);
      }

      await vault.adapter.write(`${plugin.settings.imgDataFolder}/${fileName}.md`, initializeInfo(template, imgPath, imgName))
      infoFile = (vault.getAbstractFileByPath(`${plugin.settings.imgDataFolder}/${fileName}.md`) as TFile)
    }
    return infoFile
  }

  // Specified Resources folder does not exist
  return null
};

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

/**
 * Return images in the specified directory
 * @param path - path to project e.g. 'Test Project/First Sub Project'
 * @param name - image name to filter by
 * @param vaultFiles - list of all TFiles of Obsidian vault
 * @param handler - Obsidian vault handler
 */
export const getImageResources = async (path: string, name: string, tag: string, exclusive: boolean, vaultFiles: TFile[], handler: DataAdapter, plugin: GalleryTagsPlugin): Promise<[ImageResources,number]> =>
{
  const imgList: ImageResources = {}

  let reg
  try 
  {
    reg = new RegExp(`^${path}.*${name}.*$`)
    if (path === '/')
    {
      reg = new RegExp(`^.*${name}.*$`)
    }
  } catch (error)
  {
    console.log('Gallery Search - BAD REGEX! regex set to `.*` as default!!')
    reg = '.*'
  }

  let count: number = 0;
  for (const file of vaultFiles)
  {
    if (EXTENSIONS.contains(file.extension.toLowerCase()) && file.path.match(reg) )
    {
      count++;
      if( await containsTags(file, tag, exclusive, plugin))
      {
        imgList[handler.getResourcePath(file.path)] = file.path
      }
    }
  }
  return [imgList, count];
};

export const setLazyLoading = () =>
{
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
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

/**
 * assesses if file matches the tag patterns passed
 * @param file - the image file to assess
 * @param tags - string that contains all the tags filter by separated by spaces
 * @param exclusive - if true filter requires all tags to match, if false filter matches for any tag
 * @param plugin - a link to the plugin for access to resources
 * @returns - true if the file should be included by the filter
 */
const containsTags = async (file: TFile, tags: string, exclusive: boolean, plugin: GalleryTagsPlugin): Promise<boolean> =>
{
  if(tags == null || tags == "")
  {
    return true;
  }

  let filterTags: string[] = tags.split(' ');
  let imgTags: string[] = [];
  let infoFile: TFile = await getImgInfo(file.path, plugin.app.vault, plugin.app.metadataCache, plugin, false);
  if(infoFile)
  {
    let imgInfoCache = plugin.app.metadataCache.getFileCache(infoFile)
    if (imgInfoCache)
    {
      imgTags = getAllTags(imgInfoCache)
    }
  }
  
  for(let k = 0; k < filterTags.length; k++)
  {
    if(filterTags[k][0] == '-')
    {
      filterTags.unshift(filterTags[k]);
      filterTags.splice(k+1, 1);
    }
  }

  let hasPositive: boolean = false;

  for(let k = 0; k < filterTags.length; k++)
  {
    let negate: boolean = false;
    let tag = filterTags[k];
    if(tag[0] == '-')
    {
      tag = tag.substring(1);
      negate = true;
    }
    else
    {
      hasPositive = true;
    }

    if(tag == "")
    {
      continue;
    }

    if(containsTag(tag, imgTags))
    {
      if(negate)
      {
        return false;
      }
      
      if(!exclusive)
      {
        return true;
      }
    }
    else if(exclusive && !negate)
    {
      return false;
    }
  }

  if(!hasPositive)
  {
    return true;
  }
  
  return exclusive;
};

const containsTag = (tagFilter:string, tags: string[]): boolean =>
{  
  for(let i = 0; i < tags.length; i++)
  {
    if(tags[i].contains(tagFilter))
    {
      return true;
    }
  }

  return false;
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
