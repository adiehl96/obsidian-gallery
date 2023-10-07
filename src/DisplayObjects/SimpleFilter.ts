import { SortingMenu } from "../Modals/SortingMenu";
import { loc } from "../Loc/Localizer";
import type { ImageGrid } from "./ImageGrid";
import { setIcon } from "obsidian";
import { MIN_IMAGE_WIDTH } from "../TechnicalFiles/Constants";
import type { IFilter } from "../TechnicalFiles/IFilter";

export class SimpleFilter implements IFilter
{
	containerEl: HTMLElement

	#imageGrid: ImageGrid
	#tagFilterEl: HTMLInputElement
	#sortReverseDiv: HTMLAnchorElement
	#exclusiveFilterDiv: HTMLDivElement
	#widthScaleEl: HTMLInputElement

	constructor(containerEl:HTMLElement, imageGrid: ImageGrid)
	{
		if(!containerEl)
		{
		  return;
		}

		this.containerEl = containerEl;
		this.#imageGrid = imageGrid;
	
		const filterTopDiv = this.containerEl.createDiv({cls:"gallery-search-bar"});
	
		// Filter by Tags
		this.#tagFilterEl = filterTopDiv.createEl('input', {
			cls: 'ob-gallery-filter-input',
			type: 'text',
			attr: { 'aria-label': loc('FILTER_TAGS_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_TAGS_PROMPT') }
		  })
	  
		  this.#tagFilterEl.addEventListener('input', async () =>
		  {
			this.#imageGrid.tag = this.#tagFilterEl.value.trim();
			await this.updateData();
			this.updateDisplay();
		  });
		  
		// Filter Exclusive or inclusive
		this.#exclusiveFilterDiv = filterTopDiv.createDiv({
			cls: 'icon-toggle',
			attr: { 'aria-label': loc('FILTER_EXCLUSIVE_TOOLTIP')}
		  })
		  setIcon(this.#exclusiveFilterDiv, "check-check")
	  
		  this.#exclusiveFilterDiv.addEventListener('mousedown', async () =>
		  {
			this.#imageGrid.exclusive = !this.#imageGrid.exclusive;
			if(this.#imageGrid.exclusive)
			{
			  this.#exclusiveFilterDiv.addClass("icon-checked");
			}
			else
			{
			  this.#exclusiveFilterDiv.removeClass("icon-checked");
			}
			await this.updateData();
			this.updateDisplay();
		  });
	
		// Sort menu
		this.#sortReverseDiv = filterTopDiv.createEl('a', {
		  cls: 'view-action',
		  attr: { 'aria-label': loc('SORT_ORDER_TOOLTIP')}
		})
		setIcon(this.#sortReverseDiv, "arrow-up-down")
		
		this.#sortReverseDiv.addEventListener('click', (event) =>
		{
		  new SortingMenu(event.pageX, event.pageY, this.#imageGrid);
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
		this.#widthScaleEl.max = (this.#imageGrid.areaWidth())+"";
		this.#widthScaleEl.value = this.#imageGrid.maxWidth+"";
		this.#widthScaleEl.addEventListener('input', async () =>
		{
		  this.#imageGrid.maxWidth = parseInt(this.#widthScaleEl.value);
		  if(this.#imageGrid.haveColumnsChanged())
		  {
			this.updateDisplay();
		  }
		});
	}

	
	filterFill()
	{
		this.#tagFilterEl.value = this.#imageGrid.tag.trim();
		this.#widthScaleEl.value = this.#imageGrid.maxWidth+"px";
		if(this.#imageGrid.reverse)
		{
			this.#sortReverseDiv.addClass("icon-checked");
		}
		else
		{
			this.#sortReverseDiv.removeClass("icon-checked");
		}
		if(this.#imageGrid.exclusive)
		{
			this.#exclusiveFilterDiv.addClass("icon-checked");
		}
		else
		{
			this.#exclusiveFilterDiv.removeClass("icon-checked");
		}
	}

	onResize()
	{
		this.#widthScaleEl.max = (this.#imageGrid.areaWidth())+"";
	}
	
	async updateData(): Promise<void>
	{
	  await this.#imageGrid.updateData();
	  await this.#imageGrid.updateLastFilter();
	}

	async updateDisplay(): Promise<void>
	{
	  await this.#imageGrid.updateDisplay();
	}
}