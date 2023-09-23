import { ItemView, MarkdownRenderer, TFile, WorkspaceLeaf } from "obsidian"
import type GalleryTagsPlugin from "../main"
import { getImgInfo } from "../utils"
import { GALLERY_RESOURCES_MISSING, OB_GALLERY_INFO } from "../TechnicalFiles/Constants"

export class GalleryInfoView extends ItemView
{
  viewEl: HTMLElement
  previewEl: HTMLElement
  sourceEl: HTMLElement
  editorEl: HTMLTextAreaElement
  infoFile: TFile | null = null
  plugin: GalleryTagsPlugin
  fileContent: string

  constructor(leaf: WorkspaceLeaf, plugin: GalleryTagsPlugin)
  {
    super(leaf)
    this.plugin = plugin

    // Get View Container Element
    this.viewEl = this.containerEl.getElementsByClassName('view-content')[0] as HTMLElement
    // Add Preview Mode Container
    this.previewEl = this.viewEl.createDiv({
      cls: 'markdown-preview-view',
      attr: { style: 'display: block' }
    })
    this.contentEl = this.previewEl.createDiv({
      cls: 'markdown-preview-sizer markdown-preview-section'
    })
    // Add Source Mode Container
    this.sourceEl = this.viewEl.createDiv({ cls: 'cm-s-obsidian', attr: { style: 'display: none' } })
    // Add code mirro editor
    this.editorEl = this.sourceEl.createEl('textarea', { cls: 'image-info-cm-editor' })

    this.render = this.render.bind(this)
    this.clear = this.clear.bind(this)
    this.updateInfoDisplay = this.updateInfoDisplay.bind(this)
  }

  getViewType(): string
  {
    return OB_GALLERY_INFO
  }

  getDisplayText(): string
  {
    return 'Image Info'
  }

  getIcon(): string
  {
    return 'fa-Images'
  }

  async onClose(): Promise<void>
  {
    // Clear the preview and editor history
    this.clear()
    await Promise.resolve()
  }

  onload(): void
  {    
  }

  static async OpenLeaf(plugin: GalleryTagsPlugin, imgPath:string = null) : Promise<GalleryInfoView>
  {
    // Open Info panel
    const workspace = plugin.app.workspace
    workspace.detachLeavesOfType(OB_GALLERY_INFO)
    const infoView = workspace.getLeavesOfType(OB_GALLERY_INFO)[0]
    if (infoView)
    {
      workspace.revealLeaf(
        infoView
      );
      return;
    }

    if (!workspace.layoutReady)
    {
      return;
    }

    await workspace.getRightLeaf(false).setViewState({ type: OB_GALLERY_INFO })
    workspace.revealLeaf(workspace.getLeavesOfType(OB_GALLERY_INFO)[0]);

	const infoLeaf = workspace.getLeavesOfType(OB_GALLERY_INFO)[0];
	
	if (infoLeaf?.view instanceof GalleryInfoView)
	{
		if(imgPath && imgPath.length > 0)
		{
			infoLeaf.view.updateInfoDisplay(imgPath);
		}
		return infoLeaf.view;
    }

	return null;
  }

  static closeInfoLeaf(plugin: GalleryTagsPlugin)
  {
    plugin.app.workspace.detachLeavesOfType(OB_GALLERY_INFO)
  }

  async updateInfoDisplay(imgPath: string)
  {
    this.infoFile = null;
    
    if(!this.infoFile)
    {
      this.infoFile = await getImgInfo(imgPath, this.plugin, true);
    }

    // Handle disabled img info functionality or missing info block
    let infoText = GALLERY_RESOURCES_MISSING
    if (this.infoFile)
    {
      infoText = await this.app.vault.cachedRead(this.infoFile)
    }

    // Clear the preview and editor history
    this.clear()

    this.fileContent = infoText
    this.render()
  }

  async render(): Promise<void>
  {
    this.contentEl.empty()
    MarkdownRenderer.render(this.app, this.fileContent, this.contentEl, '/', this)
  }

  clear(): void
  {
    this.contentEl.empty()
    this.fileContent = ''
  }
}
