import { ItemView, type WorkspaceLeaf, setIcon, type ViewStateResult } from 'obsidian'
import { OB_GALLERY } from '../TechnicalFiles/Constants'
import { MediaGrid } from './MediaGrid'
import { MediaSearch } from "../TechnicalFiles/MediaSearch"
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
import { GrammarFilter } from './GrammarFilter'

export class GalleryView extends ItemView
{
  plugin: GalleryTagsPlugin
  headerEl: HTMLElement 
  viewEl: HTMLElement 
  controlEl: HTMLElement 
  displayEl: HTMLDivElement
  filterEl: HTMLElement
  mediaSearch: MediaSearch
  mediaGrid: MediaGrid
  
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
		  new FilterMenu(event.pageX, event.pageY, this.filter, this.mediaSearch, this.plugin );
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
    this.mediaSearch = new MediaSearch(plugin);
    this.mediaGrid = new MediaGrid(this.displayEl, this.mediaSearch, plugin);

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

	getState() 
  {
		return {
			filter: this.mediaSearch.getFilter()
		};
	}

	async setState(
		state: { filter: string },
		result: ViewStateResult
	): Promise<void> 
  {
		if (state && typeof state === "object") 
    {
			if ( "filter" in state &&
				state.filter &&
				typeof state.filter === "string")
      {
        this.mediaSearch.setFilter(state.filter);
        this.filter.filterFill();
        await this.filter.updateData();
        await this.filter.updateDisplay();
			}
		}
    
		super.setState(state, result);
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
      case FilterType.NONE : this.filter = new NullFilter(this.filterEl, this.mediaGrid, this.mediaSearch); break;
      case FilterType.SIMPLE : this.filter = new SimpleFilter(this.filterEl, this.mediaGrid, this.mediaSearch); break;
      case FilterType.CLASSIC : this.filter = new ClassicFilter(this.filterEl, this.mediaGrid, this.mediaSearch); break;
      case FilterType.ADVANCED : this.filter = new GrammarFilter(this.filterEl, this.mediaGrid, this.mediaSearch); break;
    }
    this.filter.filterFill();
  }

  async onClose(): Promise<void>
  {
    // Hide focus elements
    GalleryInfoView.closeInfoLeaf(this.plugin);
    await Promise.resolve()
  }

  async onOpen(): Promise<void>
  {
    this.mediaSearch.clearFilter();

    if(validString(this.plugin.platformSettings().defaultFilter))
    {
      if("LAST_USED_FILTER" == this.plugin.platformSettings().defaultFilter)
      {
        if(validString(this.plugin.platformSettings().lastFilter))
        {
          this.mediaSearch.setFilter(this.plugin.platformSettings().lastFilter);
        }
      }
      else
      {
        this.mediaSearch.setNamedFilter(this.plugin.platformSettings().defaultFilter);
      }
    }

    this.filter.filterFill();
    
    await this.filter.updateData();
    await this.filter.updateDisplay();

    const infoView = await GalleryInfoView.OpenLeaf(this.plugin);
    
    // Add listener to change active file
    this.mediaGrid.setupClickEvents(infoView);
  }
}