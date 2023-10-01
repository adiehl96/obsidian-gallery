import { SortingMenu } from "../Modals/SortingMenu";
import { loc } from "../Loc/Localizer";
import type { ImageGrid } from "./ImageGrid";
import { setIcon } from "obsidian";
import { MIN_IMAGE_WIDTH } from "../TechnicalFiles/Constants";
import type { IFilter } from "./IFilter";

export class ClassicFilter implements IFilter
{
	containerEl: HTMLElement
	countEl: HTMLLabelElement

	#imageGrid: ImageGrid
	#pathFilterEl: HTMLInputElement
	#nameFilterEl: HTMLInputElement
	#tagFilterEl: HTMLInputElement
	#sortReverseDiv: HTMLAnchorElement
	#matchFilterDiv: HTMLDivElement
	#exclusiveFilterDiv: HTMLDivElement
	#widthScaleEl: HTMLInputElement
	#randomDiv: HTMLDivElement
	#randomEl: HTMLInputElement
	
	

	constructor(containerEl:HTMLElement, imageGrid: ImageGrid)
	{
		if(!containerEl)
		{
		  return;
		}

		this.containerEl = containerEl;
		this.#imageGrid = imageGrid;
	
		const filterTopDiv = this.containerEl.createDiv({cls:"gallery-search-bar"});
		const filterBottomDiv = this.containerEl.createDiv({cls:"gallery-search-bar"});
	
		// Filter by path
		this.#pathFilterEl = filterTopDiv.createEl('input', {
		  cls: 'ob-gallery-filter-input',
		  type: 'text',
		  attr: { 'aria-label': loc('FILTER_PATH_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_PATH_PROMPT') }
		})
		this.#pathFilterEl.value = this.#imageGrid.plugin.settings.galleryLoadPath;
	
		this.#pathFilterEl.addEventListener('input', async () =>
		{
		  this.#imageGrid.path = this.#pathFilterEl.value.trim();
		  await this.updateData();
		  this.updateDisplay();
		});
	
		// Filter by Name
		this.#nameFilterEl = filterTopDiv.createEl('input', {
		  cls: 'ob-gallery-filter-input',
		  type: 'text',
		  attr: { 'aria-label': loc('FILTER_NAME_TOOLTIP'), spellcheck: false, placeholder: loc('FILTER_NAME_PROMPT') }
		})
	
		this.#nameFilterEl.addEventListener('input', async () =>
		{
		  this.#imageGrid.name = this.#nameFilterEl.value.trim();
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
	
		// file filter counts
		this.countEl = filterTopDiv.createEl('label', {attr: { 'aria-label': loc('COUNT_TOOLTIP')}});
		this.countEl.textContent = "counts";
	
		// Filter by Tags
		this.#tagFilterEl = filterBottomDiv.createEl('input', {
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
	
		// Filter Match Case
		this.#matchFilterDiv = filterBottomDiv.createDiv({
		  cls: 'icon-toggle',
		  attr: { 'aria-label': loc('FILTER_MATCH_CASE_TOOLTIP')}
		})
		setIcon(this.#matchFilterDiv, "case-sensitive")
	
		this.#matchFilterDiv.addEventListener('mousedown', async () =>
		{
		  this.#imageGrid.matchCase = !this.#imageGrid.matchCase;
		  if(this.#imageGrid.matchCase)
		  {
			this.#matchFilterDiv.addClass("icon-checked");
		  }
		  else
		  {
			this.#matchFilterDiv.removeClass("icon-checked");
		  }
		  await this.updateData();
		  this.updateDisplay();
		});
	
		// Filter Exclusive or inclusive
		this.#exclusiveFilterDiv = filterBottomDiv.createDiv({
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
	
		// image width scaler
		this.#widthScaleEl = filterBottomDiv.createEl("input", {
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
	
		// Add action button to show random options and randomize them
		this.#randomDiv = filterBottomDiv.createDiv();
		const randomButton = filterTopDiv.createEl('a', { cls: 'view-action', attr: { 'aria-label': loc('FILTER_RANDOM_TOOLTIP') } })
		setIcon(randomButton, 'dice')
		this.#randomDiv.style.display = "none";
		this.#randomDiv.style.marginLeft= "auto";
		this.#randomEl = this.#randomDiv.createEl('input', {
		  cls: 'ob-gallery-filter-input',
		  type: 'number',
		  attr: { 'aria-label': loc('FILTER_RANDOM_COUNT_TOOLTIP'), min:"1", value: "10" }
		})
		this.#randomEl.style.marginLeft= "auto";
		this.#randomEl.addEventListener("focus", async ()=>{
		  await this.updateData();
		  this.updateDisplay();
		})
		this.#randomEl.addEventListener("input", async ()=>{
		  this.#imageGrid.random = parseInt(this.#randomEl.value);
		  await this.updateData();
		  this.updateDisplay();
		})
	
		randomButton.onClickEvent(async () =>
		{
		  const currentMode = this.#randomDiv.style.getPropertyValue('display')
		  if (currentMode === 'block')
		  {
			this.#randomDiv.style.setProperty('display', 'none')
			this.#imageGrid.random = 0;
			this.#imageGrid.customList = [];
			await this.updateData();
			this.updateDisplay();
			return;
		  }
		  this.#randomDiv.style.setProperty('display', 'block')
		  this.#imageGrid.random = parseInt(this.#randomEl.value);
		  await this.updateData();
		  this.updateDisplay();
		});
	}

	
	filterFill()
	{
		this.#pathFilterEl.value = this.#imageGrid.path.trim();
		this.#nameFilterEl.value = this.#imageGrid.name.trim();
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
		if(this.#imageGrid.matchCase)
		{
			this.#matchFilterDiv.addClass("icon-checked");
		}
		else
		{
			this.#matchFilterDiv.removeClass("icon-checked");
		}
		if(this.#imageGrid.exclusive)
		{
			this.#exclusiveFilterDiv.addClass("icon-checked");
		}
		else
		{
			this.#exclusiveFilterDiv.removeClass("icon-checked");
		}
		if(this.#imageGrid.random > 0)
		{
		  this.#randomEl.value = this.#imageGrid.random+"";
		  this.#randomDiv.style.setProperty('display', 'block');
		}
		else
		{
			this.#randomDiv.style.setProperty('display', 'none');
		}
	}

	onResize()
	{
		this.#widthScaleEl.max = (this.#imageGrid.areaWidth)+"";
	}
	
	async updateData(): Promise<void>
	{
	  await this.#imageGrid.updateData();
	  this.countEl.setText(this.#imageGrid.imgList.length+"/"+this.#imageGrid.totalCount);
	  this.#randomEl.max = this.#imageGrid.totalCount+"";
	}

	async updateDisplay(): Promise<void>
	{
	  await this.#imageGrid.updateDisplay();
	}
}