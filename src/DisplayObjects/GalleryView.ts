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
import { FilterTypeMenu } from '../Modals/FilterTypeMenu'
import { FilterMenu } from '../Modals/FilterMenu'
import { validString } from '../utils'
import { NullFilter } from './NullFilter'

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
  
  filterType: FilterType
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

    // Create Search Control Element
    this.filterEl = this.viewEl.createDiv({ cls: 'ob-gallery-filter', attr: { style: 'display: none;' } })

    // Add action button to hide / show filter panel
    const filterButton = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('FILTER_TOOLTIP') } })
    setIcon(filterButton, 'filter')

		filterButton.addEventListener('click', (event) =>
		{
		  new FilterMenu(event.pageX, event.pageY, this.filter, this.imageGrid, this.plugin );
		});
    
    // Add action button to hide / show filter panel
    const searchButton = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('SEARCH_TOOLTIP') } })
    setIcon(searchButton, 'fa-search')

		searchButton.addEventListener('click', (event) =>
		{
		  new FilterTypeMenu(event.pageX, event.pageY, this.filterType, this.plugin.accentColor, (filterType) => this.setFilter(filterType));
		});
    
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

    this.setFilter(this.plugin.platformSettings().filterType);
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
    this.filterType = filter;
    this.filterEl.style.setProperty('display', 'block');

    switch(filter)
    {
      case FilterType.NONE : this.filter = new NullFilter(this.filterEl, this.imageGrid); break;
      case FilterType.SIMPLE : this.filter = new SimpleFilter(this.filterEl, this.imageGrid); break;
      case FilterType.CLASSIC : this.filter = new ClassicFilter(this.filterEl, this.imageGrid); break;
      case FilterType.ADVANCED : this.filter = new ClassicFilter(this.filterEl, this.imageGrid); break;
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
    this.imageGrid.clearFilter();

    if(validString(this.plugin.platformSettings().defaultFilter))
    {
      if("LAST_USED_FILTER" == this.plugin.platformSettings().defaultFilter)
      {
        if(validString(this.plugin.platformSettings().lastFilter))
        {
          this.imageGrid.setFilter(this.plugin.platformSettings().lastFilter);
        }
      }
      else
      {
        this.imageGrid.setNamedFilter(this.plugin.platformSettings().defaultFilter);
      }
    }

    this.filter.filterFill();
    
    await this.filter.updateData();
    await this.filter.updateDisplay();

    const infoView = await GalleryInfoView.OpenLeaf(this.plugin);
    
    // Add listener to change active file
    this.imageGrid.setupClickEvents(this.imageFocusEl, this.focusVideo, this.focusImage, infoView);
  }
}