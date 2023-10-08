import { SortingMenu } from "../Modals/SortingMenu";
import { loc } from "../Loc/Localizer";
import type { MediaGrid } from "./MediaGrid";
import type { MediaSearch } from "../TechnicalFiles/MediaSearch";
import { setIcon } from "obsidian";
import { MIN_IMAGE_WIDTH } from "../TechnicalFiles/Constants";
import type { IFilter } from "../TechnicalFiles/IFilter";
import { parseAdvanceSearch } from "../TechnicalFiles/GammarParse";

export class GrammarFilter implements IFilter
{
	containerEl: HTMLElement

	#mediaSearch: MediaSearch
	#mediaGrid: MediaGrid
	#grammarFilterEl: HTMLTextAreaElement
	#sortReverseDiv: HTMLAnchorElement
	#widthScaleEl: HTMLInputElement

	constructor(containerEl:HTMLElement, mediaGrid: MediaGrid, mediaSearch: MediaSearch)
	{
		if(!containerEl)
		{
		  return;
		}

		this.containerEl = containerEl;
		this.#mediaSearch = mediaSearch;
		this.#mediaGrid = mediaGrid;
	
		const filterTopDiv = this.containerEl.createDiv({cls:"gallery-search-bar"});
	
		// Filter by Tags
		this.#grammarFilterEl = filterTopDiv.createEl('textarea', {
			cls: 'ob-gallery-filter-input',
			//attr: { 'aria-label': loc('FILTER_TAGS_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_TAGS_PROMPT') }
		  })
	  
		  this.#grammarFilterEl.addEventListener('input', async () =>
		  {
			parseAdvanceSearch(this.#grammarFilterEl.value, this.#mediaSearch);
			await this.updateData();
			await this.updateDisplay();
		  });
		
		// Sort menu
		this.#sortReverseDiv = filterTopDiv.createEl('a', {
		  cls: 'view-action',
		  attr: { 'aria-label': loc('SORT_ORDER_TOOLTIP')}
		})
		setIcon(this.#sortReverseDiv, "arrow-up-down")
		
		this.#sortReverseDiv.addEventListener('click', (event) =>
		{
		  new SortingMenu(event.pageX, event.pageY, this.#mediaSearch, this.#mediaGrid);
		});
		
		// image width scaler
		this.#widthScaleEl = filterTopDiv.createEl("input", {
		  cls: 'ob-gallery-filter-slider-input',
		  type: 'range',
		  attr: { 'aria-label': loc('FILTER_WIDTH_TOOLTIP')}
		});
		this.#widthScaleEl.name = 'maxWidth';
		this.#widthScaleEl.id = 'maxWidth';
		this.#widthScaleEl.min = MIN_IMAGE_WIDTH+"";
		this.#widthScaleEl.max = (this.#mediaGrid.areaWidth())+"";
		this.#widthScaleEl.value = this.#mediaSearch.maxWidth+"";
		this.#widthScaleEl.addEventListener('input', async () =>
		{
		  this.#mediaSearch.maxWidth = parseInt(this.#widthScaleEl.value);
		  if(this.#mediaGrid.haveColumnsChanged())
		  {
			await this.updateDisplay();
		  }
		});
	}

	
	filterFill()
	{
		let value = ""
		if(this.#mediaSearch.path != "")
		{
			value +=  "path:"+this.#mediaSearch.path.trim() +" ";
		}
		if(this.#mediaSearch.name != "")
		{
			value +=  "name:"+this.#mediaSearch.name.trim() +" ";
		}
		if(this.#mediaSearch.regex != "")
		{
			value +=  "regex:"+this.#mediaSearch.regex.trim() +" ";
		}
		if(this.#mediaSearch.tag != "")
		{
			value +=  "tag:"+this.#mediaSearch.tag.trim() +" ";
		}
		this.#grammarFilterEl.value = value;
		this.#widthScaleEl.value = this.#mediaSearch.maxWidth+"px";
	}

	onResize()
	{
		this.#widthScaleEl.max = (this.#mediaGrid.areaWidth())+"";
	}
	
	async updateData(): Promise<void>
	{
	  await this.#mediaSearch.updateData();
	  await this.#mediaSearch.updateLastFilter();
	}

	async updateDisplay(): Promise<void>
	{
	  await this.#mediaGrid.updateDisplay();
	}
}