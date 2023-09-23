import { Plugin, type WorkspaceLeaf, addIcon, Menu, Editor, MarkdownView, type MarkdownFileInfo, MenuItem, Notice, TFile } from 'obsidian'
import { scaleColor, type ImageResources, addEmbededTags } from './utils'
import { GallerySettingTab } from './settings'
import { GalleryBlock } from './Blocks/GalleryBlock'
import { ImageInfoBlock } from './Blocks/ImageInfoBlock'
import { GalleryView } from './DisplayObjects/GalleryView'
import { GalleryInfoView } from './DisplayObjects/GalleryInfoView'
import type { GallerySettings } from './TechnicalFiles/GallerySettings'
import { DEFAULT_SETTINGS, OB_GALLERY, OB_GALLERY_INFO, GALLERY_ICON, GALLERY_SEARCH_ICON } from './TechnicalFiles/Constants'
import { loc } from './Loc/Localizer'

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
  

  async onload()
  {
    // Load message
    await this.loadSettings();
    console.log(loc("LOADED_PLUGIN_MESSAGE"));

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

    // Add Gallery Settings tab
    this.addSettingTab(new GallerySettingTab(this.app, this))

    // Save settings
    this.saveSettings()

    this.refreshColors()
    
		let style = document.createElement('style');
		style.innerHTML = '.icon-checked { color: '+this.accentColor+'; }';
		document.getElementsByTagName('head')[0].appendChild(style);	

		style = document.createElement('style');
		style.innerHTML = '.selected-item { border: 5px solid '+this.accentColorLight+'; }';
		document.getElementsByTagName('head')[0].appendChild(style);	
         
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
      
    this.registerEvent(
      this.app.metadataCache.on("changed", async (file) => 
      {
        if(this.embedQueue[file.path])
        {
          const imgTFile = this.app.vault.getAbstractFileByPath(this.embedQueue[file.path]) as TFile
          
          this.finalizedQueue[file.path] = this.embedQueue[file.path];
          delete this.embedQueue[file.path];
          
          await addEmbededTags(imgTFile, file, this);
        }
        else if(this.finalizedQueue[file.path])
        {
          GalleryInfoView.OpenLeaf(this, this.finalizedQueue[file.path]);
        }
      }));

      
    this.refreshViewTrigger();
            
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

  imgSelector: string = `.workspace-leaf-content[data-type='markdown'] img,`
                              +`.workspace-leaf-content[data-type='image'] img,`
                              +`.community-modal-details img,#sr-flashcard-view img,`
                              +`.workspace-leaf-content[data-type='markdown'] video,`
                              +`.workspace-leaf-content[data-type='video'] video,`
                              +`.community-modal-details video,`
                              +`.video-stream video`
                              +`#sr-flashcard-view video`;
  /**
   * Refresh image context events for main container
   * This feels gross, but I currently don't know another way to get right click events on images and videos
   */
  refreshViewTrigger = (doc?: Document) => 
  {
    if (!doc) 
    {
      doc = document;
    }

    doc.off('contextmenu', this.imgSelector, this.clickImage);

    doc.on('contextmenu', this.imgSelector, this.clickImage);
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

    // This is kinda messy, but it gets the job done for now
    //@ts-ignore
    let source : string = targetEl.parentElement?.attributes?.src?.value;
    if(!source)
    {
      source = targetEl.src;
    }

    GalleryInfoView.OpenLeaf(this,source);
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

  refreshColors()
  {
		// @ts-ignore
		this.accentColor = this.app.vault.getConfig('accentColor')
		this.accentColorDark = scaleColor(this.accentColor, 0.25);
		this.accentColorLight = scaleColor(this.accentColor, 1.5);
  }

  onunload()
  {
    console.log(loc("UNLOADING_PLUGIN_MESSAGE"))
    
    document.off('contextmenu', this.imgSelector, this.clickImage);
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

