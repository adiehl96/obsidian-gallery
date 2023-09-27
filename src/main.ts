import { Plugin, type WorkspaceLeaf, addIcon, Menu, Editor, MarkdownView, type MarkdownFileInfo, MenuItem, Notice, TFile, getAllTags, TFolder, TAbstractFile } from 'obsidian'
import { scaleColor, type ImageResources, addEmbededTags, getimageLink, getImageInfo, preprocessUri } from './utils'
import { GallerySettingTab } from './settings'
import { GalleryBlock } from './Blocks/GalleryBlock'
import { ImageInfoBlock } from './Blocks/ImageInfoBlock'
import { GalleryView } from './DisplayObjects/GalleryView'
import { GalleryInfoView } from './DisplayObjects/GalleryInfoView'
import type { GallerySettings } from './TechnicalFiles/GallerySettings'
import { DEFAULT_SETTINGS, OB_GALLERY, OB_GALLERY_INFO, GALLERY_ICON, GALLERY_SEARCH_ICON, EXTENSIONS } from './TechnicalFiles/Constants'
import { loc } from './Loc/Localizer'
import { ProgressModal } from './Modals/ProgressPopup'

export default class GalleryTagsPlugin extends Plugin
{
  settings!: GallerySettings;
  containerEl!: HTMLElement;
	accentColor: string;
	accentColorDark: string;
  accentColorLight: string;
  onResize: () => void;
  embedQueue: ImageResources = {};
  finalizedQueue: ImageResources = {};
  tagCache:string[] = [];
	imgResources: ImageResources = {}
	metaResources: ImageResources = {}
  

  async onload()
  {
    // Load message
    await this.loadSettings();
    console.log(loc("LOADED_PLUGIN_MESSAGE"));

    this.#registerCodeBlocks();

    // Add Gallery Icon
    addIcon('fa-Images', GALLERY_ICON)
    addIcon('fa-search', GALLERY_SEARCH_ICON)

    // Register Main Gallery View
    this.registerView(OB_GALLERY, this.galleryViewCreator.bind(this))
    this.registerView(OB_GALLERY_INFO, this.galleryInfoCreator.bind(this))

    // Add Main Gallery Ribbon
    this.addRibbonIcon('fa-Images', 'Gallery', async (e) =>
    {
      await this.showPanel()
    });

    this.addSettingTab(new GallerySettingTab(this.app, this))
    this.saveSettings();

    this.app.workspace.onLayoutReady(this.#bootstrap.bind(this));

    // might use this later for integration tasks
    // this.manifest.dir
    // this.plugins.plugins.dataview.manifest.dir
  }

  async #bootstrap()
  {
    this.#buildTagCache();
    this.#buildImageCache();
    await this.#buildMetaCache();
    this.#refreshColors();
    this.#registerEvents();
    this.#refreshViewTrigger();
  }

  #registerCodeBlocks()
  {
    // Register gallery display block renderer
    this.registerMarkdownCodeBlockProcessor('gallery', async (source, el, ctx) =>
    {
      const proc = new GalleryBlock()
      await proc.galleryDisplay(source, el, this.app.vault, this)
    });

    // Register image info block
    this.registerMarkdownCodeBlockProcessor('gallery-info', async (source, el, ctx) =>
    {
      const proc = new ImageInfoBlock()
      await proc.galleryImageInfo(source, el, ctx.sourcePath, this)
    });
  }

  #registerEvents()
  {  
    // Resize event
    this.registerEvent(
      this.app.workspace.on("resize", () => {
        try
        {
          if(this.onResize) 
          {
            this.onResize()
          }
        }
        catch(e)
        {
          this.onResize = null;
        }
      }));
      
    // Metadata changed event
    this.registerEvent(
      this.app.metadataCache.on("changed", async (file, data, cache) => 
      {
        // Used for reacting to meta file creation events in real time
        if(this.embedQueue[file.path])
        {
          const imgTFile = this.app.vault.getAbstractFileByPath(this.embedQueue[file.path]) as TFile
          
          this.finalizedQueue[file.path] = this.embedQueue[file.path];
          delete this.embedQueue[file.path];
          
          this.metaResources[imgTFile.path] = file.path;
          await addEmbededTags(imgTFile, file, this);
        }
        else if(this.finalizedQueue[file.path])
        {
          GalleryInfoView.OpenLeaf(this, this.finalizedQueue[file.path]);
          delete this.finalizedQueue[file.path];
        }
        
        // try to catch and cache any new tags
        const newTags = getAllTags(cache);
        for(let k = 0; k < newTags.length; k++)
        {
          if(!this.tagCache.contains(newTags[k]))
          {
            this.tagCache.push(newTags[k])
          }
        }
      }));

    // Image created
    this.registerEvent(this.app.vault.on("create", this.#imageRegister.bind(this)));

    // Image Renamed
    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => 
      {
        this.#imageRegister(file);

        // TODO: I hate every single one of these, cause it means I'm waiting on something and I don't know what
        await new Promise(f => setTimeout(f, 300));

        const infoFile = await getImageInfo(oldPath, false, this);

        this.metaResources[file.path] = infoFile.path;
        delete this.metaResources[oldPath];

        // update the links in the meta file
        if(infoFile)
        {
          await this.app.vault.process(infoFile, (data) =>{
        		data = data.replaceAll(oldPath, file.path);

        		const oldUri = preprocessUri(oldPath)
        		const newUri = preprocessUri(file.path)
        		data = data.replaceAll(oldUri, newUri);

        		return data;
        	});
        }
      }));
            
    // this.registerEvent(
    //   this.app.workspace.on("file-menu", async (menu,editor, info) => 
    //   {
    //     new Notice("file Menu")
    //   }));

		// this.registerEvent(
		// 	this.app.workspace.on(
		// 		"editor-menu",
		// 		this.testOption
		// 	)
		// );
  }

  #imageRegister(file:TAbstractFile)
  {
    if(!(file instanceof TFile))
    {
      return;
    }
    if(!EXTENSIONS.contains(file.extension.toLowerCase()))
    {
      return;
    }

    this.imgResources[this.app.vault.getResourcePath(file)] = file.path;
  }

  #buildTagCache()
  {
    this.tagCache = [];
    
		const files = this.app.vault.getMarkdownFiles();
		for(let i = 0; i < files.length; i++)
		{
			const tags = getAllTags(this.app.metadataCache.getFileCache(files[i]));
			for(let k = 0; k < tags.length; k++)
			{
				if(!this.tagCache.contains(tags[k]))
				{
					this.tagCache.push(tags[k])
				}
			}
		}
  }

  #buildImageCache()
  {
    this.imgResources = {};

		const vaultFiles = this.app.vault.getFiles()
		
		for (const file of vaultFiles)
		{
			if (EXTENSIONS.contains(file.extension.toLowerCase()))
			{
					this.imgResources[this.app.vault.getResourcePath(file)] = file.path
			}
		}
  }
  
	async #buildMetaCache(): Promise<void>
	{
		this.metaResources = {};
		const infoFolder = this.app.vault.getAbstractFileByPath(this.settings.imgDataFolder)
	
		if (infoFolder instanceof TFolder)
		{
			let cancel = false;
			const progress = new ProgressModal(this, infoFolder.children.length, ()=>{cancel = true;})
			progress.open();

			for (let i = 0; i < infoFolder.children.length; i++) 
			{
				if(cancel)
				{
					new Notice(loc('CANCEL_LOAD_NOTICE'));
					return;
				}
				
				progress.updateProgress(i);
				
				const info = infoFolder.children[i];
				let imgLink = await getimageLink(info as TFile, this);
		
				if(info && imgLink)
				{
					this.metaResources[imgLink] = info.path
				}
			}
			
			progress.updateProgress(infoFolder.children.length);
		}
	}

  #imgSelector: string = `.workspace-leaf-content[data-type='markdown'] img,`
                              +`.workspace-leaf-content[data-type='image'] img,`
                              +`.community-modal-details img,`
                              +`#sr-flashcard-view img,`
                              +`.workspace-leaf-content[data-type='markdown'] video,`
                              +`.workspace-leaf-content[data-type='video'] video,`
                              +`.community-modal-details video,`
                              +`.video-stream video`
                              +`#sr-flashcard-view video`;
                              
  /**
   * Refresh image context events for main container
   * This feels gross, but I currently don't know another way to get right click events on all images and videos
   */
  #refreshViewTrigger = (doc?: Document) => 
  {
    if (!doc) 
    {
      doc = document;
    }

    doc.off('contextmenu', this.#imgSelector, this.clickImage);

    doc.on('contextmenu', this.#imgSelector, this.clickImage);
  }
  
  private clickImage = (event: MouseEvent) => 
  {
    const targetEl = <HTMLImageElement|HTMLVideoElement>event.target;
    if (!targetEl) 
    {
      return;
    }

    if(targetEl.classList.contains("gallery-grid-img") || targetEl.classList.contains("gallery-grid-vid"))
    {
      return;
    }

    GalleryInfoView.OpenLeaf(this,targetEl.src);
  }
  
  testOption (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo)
  {
    menu.addItem((item: MenuItem) => {
      item.setTitle("Test Option")
        //.setIcon("plus-circle")
        //.setSection("cmdr")
        .onClick(async () => {
          new Notice("clicked option");
        });
    });
  }

  #refreshColors()
  {
		// @ts-ignore
		this.accentColor = this.app.vault.getConfig('accentColor');
		this.accentColorDark = scaleColor(this.accentColor, 0.25);
		this.accentColorLight = scaleColor(this.accentColor, 1.5);
    
		let style = document.createElement('style');
		style.innerHTML = '.icon-checked { color: '+this.accentColor+'; }';
		document.getElementsByTagName('head')[0].appendChild(style);	

		style = document.createElement('style');
		style.innerHTML = '.selected-item { border: 5px solid '+this.accentColorLight+'; }';
		document.getElementsByTagName('head')[0].appendChild(style);	
  }

  onunload()
  {
    console.log(loc("UNLOADING_PLUGIN_MESSAGE"))
    
    document.off('contextmenu', this.#imgSelector, this.clickImage);
    
    this.embedQueue = {};
    this.finalizedQueue = {};
    this.tagCache = [];
    this.imgResources = {};
    this.metaResources = {};
  }

  async loadSettings()
  {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings()
  {
    await this.saveData(this.settings)
  }

  galleryViewCreator(leaf: WorkspaceLeaf)
  {
    return new GalleryView(leaf, this)
  };

  galleryInfoCreator(leaf: WorkspaceLeaf)
  {
    return new GalleryInfoView(leaf, this)
  };

  showPanel = async function (this: GalleryTagsPlugin)
  {
    const workspace = this.app.workspace
    workspace.getLeaf(false).setViewState({ type: OB_GALLERY })
  };
}

