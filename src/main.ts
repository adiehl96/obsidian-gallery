import { Plugin, type WorkspaceLeaf, addIcon, Menu, Editor, MarkdownView, type MarkdownFileInfo, MenuItem, Notice } from 'obsidian'
import { type GallerySettings, SETTINGS, OB_GALLERY, OB_GALLERY_INFO, galleryIcon, gallerySearchIcon, scaleColor } from './utils'
import { GallerySettingTab } from './settings'
import { GalleryProcessor } from './block'
import { GalleryView, GalleryInfoView } from './view'

export default class GalleryTagsPlugin extends Plugin
{
  settings!: GallerySettings;
  containerEl!: HTMLElement;
	accentColor: string
	accentColorDark: string
  accentColorLight: string
  onResize: () => void;

  async onload()
  {
    // Load message
    await this.loadSettings();
    console.log('Loaded Gallery Tags Plugin');

    // Register gallery display block renderer
    this.registerMarkdownCodeBlockProcessor('gallery', async (source, el, ctx) =>
    {
      const proc = new GalleryProcessor()
      await proc.galleryDisplay(source, el, this.app.vault, this)
    });

    // Register image info block
    this.registerMarkdownCodeBlockProcessor('gallery-info', async (source, el, ctx) =>
    {
      const proc = new GalleryProcessor()
      await proc.galleryImageInfo(source, el, ctx.sourcePath, this.app.vault, this.app.metadataCache, this)
    });

    // Add Gallery Icon
    addIcon('fa-Images', galleryIcon)
    addIcon('fa-search', gallerySearchIcon)

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
    
    // this.registerEvent(
    //   this.app.workspace.on("file-menu", (menu, file, source) => { new Notice(source);}));
      
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

		// this.registerEvent(
		// 	this.app.workspace.on(
		// 		"editor-menu",
		// 		this.testOption
		// 	)
		// );
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
    console.log('unloading Gallery Plugin')
  }

  async loadSettings()
  {
    this.settings = Object.assign({}, SETTINGS, await this.loadData())
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

