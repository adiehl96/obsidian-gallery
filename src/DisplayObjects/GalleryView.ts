import { ItemView, type WorkspaceLeaf, setIcon } from 'obsidian'
import { OB_GALLERY } from '../TechnicalFiles/Constants'
import { ImageGrid } from './ImageGrid'
import type GalleryTagsPlugin from '../main'
import { GalleryInfoView } from './GalleryInfoView'
import { loc } from '../Loc/Localizer'
import type { IFilter } from "../TechnicalFiles/IFilter";
import { ClassicFilter } from './ClassicFilter'
import { SimpleFilter } from './SimpleFilter'
import { FilterType } from '../TechnicalFiles/FilterType'

export class GalleryView extends ItemView
{
  plugin: GalleryTagsPlugin
  headerEl: HTMLElement 
  viewEl: HTMLElement 
  controlEl: HTMLElement 
  displayEl: HTMLElement
  filterEl: HTMLElement
  imageFocusEl: HTMLDivElement
  focusImage: HTMLImageElement
  focusVideo: HTMLVideoElement
  imagesContainer: HTMLUListElement
  imageGrid: ImageGrid

  filter: IFilter

  constructor(leaf: WorkspaceLeaf, plugin: GalleryTagsPlugin)
  {
    super(leaf)
    this.plugin = plugin

    // Get View Container Element
    this.headerEl = this.containerEl.querySelector('.view-header')
    // Get View Container Element
    this.viewEl = this.containerEl.querySelector('.view-content')

    if(!this.viewEl) return;
    
    this.viewEl.style.setProperty('padding', '0px')
    this.viewEl.style.setProperty('overflow', 'hidden')
    
    const viewActionsEl = this.containerEl.querySelector('.view-actions');

    // Add copy filter button
    const copyFilterButton = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('COPY_FILTER_TOOLTIP') } })
    setIcon(copyFilterButton, 'copy');
    
    copyFilterButton.onClickEvent(async () =>
    {
      await navigator.clipboard.writeText(this.imageGrid.getFilter());
    });

    // Add paste filter button
    const pasteFilterButton = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('PASTE_FILTER_TOOLTIP') } })
    setIcon(pasteFilterButton, 'paste');
    
    pasteFilterButton.onClickEvent(async () =>
    {
      const filterString = await navigator.clipboard.readText();
      this.imageGrid.setFilter(filterString);

      this.filter.filterFill();

      await this.filter.updateData();
      await this.filter.updateDisplay();
    });

    // Add action button to hide / show filter panel
    const searchPanel = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('SEARCH_TOOLTIP') } })
    if(searchPanel)
    {
      setIcon(searchPanel, 'fa-search')

      // Create Search Control Element
      this.filterEl = this.viewEl.createDiv({ cls: 'ob-gallery-filter', attr: { style: 'display: none;' } })

      if(plugin.platformSettings().filterStartOpen)
      {
        this.filterEl.style.setProperty('display', 'block');
      }

      searchPanel.onClickEvent(() =>
      {
        const currentMode = this.filterEl.style.getPropertyValue('display')
        if (currentMode === 'block')
        {
          this.filterEl.style.setProperty('display', 'none')
          return;
        }
        this.filterEl.style.setProperty('display', 'block')
      });
    }
    
    // mover the context menu to the end of the action list
    if(viewActionsEl)
    {
      viewActionsEl.appendChild(viewActionsEl.children[0]);
    }
    
    // Create gallery display Element
    this.displayEl = this.viewEl.createDiv({ cls: 'ob-gallery-display' })

    this.imagesContainer = this.displayEl.createEl('ul')
    this.imageGrid = new ImageGrid(this.displayEl, this.imagesContainer, plugin);

    this.imageFocusEl = this.displayEl.createDiv({ cls: 'ob-gallery-image-focus', attr: { style: 'display: none;' } })
    const focusElContainer = this.imageFocusEl.createDiv({ attr: { class: 'focus-element-container' } })
    this.focusImage = focusElContainer.createEl('img', { attr: { style: 'display: none;' } })
    this.focusVideo = focusElContainer.createEl('video', { attr: { controls: 'controls', src: ' ', style: 'display: none; margin:auto;' } })

    this.setFilter(FilterType.CLASSIC);
  }

  getViewType(): string
  {
    return OB_GALLERY
  }

  getDisplayText(): string
  {
    return loc('GALLERY_VIEW_TITLE')
  }

  getIcon(): string
  {
    return 'fa-Images'
  }

  onResize(): void
  {
    this.filter.onResize();
    this.filter.updateDisplay();
  }

  setFilter(filter:FilterType)
  {
		this.filterEl.empty();

    switch(filter)
    {
      case FilterType.NONE : break;
      case FilterType.SIMPLE : this.filter = new SimpleFilter(this.filterEl, this.imageGrid); break;
      case FilterType.CLASSIC : this.filter = new ClassicFilter(this.filterEl, this.imageGrid); break;
    }
  }

  async onClose(): Promise<void>
  {
    // Hide focus elements
    this.imageFocusEl.style.setProperty('display', 'none');
    GalleryInfoView.closeInfoLeaf(this.plugin);
    await Promise.resolve()
  }

  async onOpen(): Promise<void>
  {
		this.imageGrid.path = this.plugin.settings.galleryLoadPath;
		this.imageGrid.name = "";
		this.imageGrid.tag = "";
		this.imageGrid.matchCase = false;
		this.imageGrid.exclusive = false;
		this.imageGrid.reverse = false;
    
    await this.filter.updateData();
    await this.filter.updateDisplay();

    const infoView = await GalleryInfoView.OpenLeaf(this.plugin);
    
    // Add listener to change active file
    this.imageGrid.setupClickEvents(this.imageFocusEl, this.focusVideo, this.focusImage, infoView);
  }
}