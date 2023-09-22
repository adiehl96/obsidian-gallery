import { ItemView, type WorkspaceLeaf, setIcon } from 'obsidian'
import { OB_GALLERY } from '../utils'
import { ImageGrid } from './ImageGrid'
import type GalleryTagsPlugin from '../main'
import { GalleryInfoView } from './GalleryInfoView'

export class GalleryView extends ItemView
{
  plugin: GalleryTagsPlugin
  headerEl: HTMLElement 
  viewEl: HTMLElement 
  controlEl: HTMLElement 
  displayEl: HTMLElement
  filterEl: HTMLElement
  countEl: HTMLLabelElement
  imageFocusEl: HTMLDivElement
  focusImage: HTMLImageElement
  focusVideo: HTMLVideoElement
  imagesContainer: HTMLUListElement
  imageGrid: ImageGrid
  widthScaleEl: HTMLInputElement

  #randomEl: HTMLInputElement

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
    const copyFilterButton = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': 'Copy filter to clipboard' } })

    // Add paste filter button
    const pasteFilterButton = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': 'Paste filter from clipboard' } })

    // Add action button to hide / show filter panel
    const searchPanel = viewActionsEl?.createEl('a', { cls: 'view-action', attr: { 'aria-label': 'Search' } })
    if(searchPanel)
    {
      setIcon(searchPanel, 'fa-search')

      // Create Search Control Element
      this.filterEl = this.viewEl.createDiv({ cls: 'ob-gallery-filter', attr: { style: 'display: none;' } })

      if(plugin.settings.filterStartOpen)
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

    if(this.filterEl)
    {
      const filterTopDiv = this.filterEl.createDiv({cls:"gallery-search-bar"});
      const filterBottomDiv = this.filterEl.createDiv({cls:"gallery-search-bar"});

      // Filter by path
      const pathFilterEl = filterTopDiv.createEl('input', {
        cls: 'ob-gallery-filter-input',
        type: 'text',
        attr: { 'aria-label': 'Folder to search', spellcheck: false, placeholder: 'Path' }
      })
      pathFilterEl.value = this.plugin.settings.galleryLoadPath;

      pathFilterEl.addEventListener('input', async () =>
      {
        this.imageGrid.path = pathFilterEl.value.trim();
        await this.updateData();
        this.updateDisplay();
      });

      // Filter by Name
      const nameFilterEl = filterTopDiv.createEl('input', {
        cls: 'ob-gallery-filter-input',
        type: 'text',
        attr: { 'aria-label': 'File name contains', spellcheck: false, placeholder: 'Name' }
      })

      nameFilterEl.addEventListener('input', async () =>
      {
        this.imageGrid.name = nameFilterEl.value.trim();
        await this.updateData();
        this.updateDisplay();
      });

      // Should display order be reversed
      const sortReverseDiv = filterTopDiv.createDiv({
        cls: 'icon-toggle',
        attr: { 'aria-label': 'Should the sort order be reversed'}
      })
      setIcon(sortReverseDiv, "arrow-up-down")

      sortReverseDiv.addEventListener('mousedown', async () =>
      {
        this.imageGrid.reverse = !this.imageGrid.reverse;
        if(this.imageGrid.reverse)
        {
          sortReverseDiv.addClass("icon-checked");
        }
        else
        {
          sortReverseDiv.removeClass("icon-checked");
        }
        await this.updateData();
        this.updateDisplay();
      });

      // file filter counts
      this.countEl = filterTopDiv.createEl('label', {attr: { 'aria-label': 'Number of files displayed by filter out of files the gallery could display'}});
      this.countEl.textContent = "counts";

      // Filter by Tags
      const tagFilterEl = filterBottomDiv.createEl('input', {
        cls: 'ob-gallery-filter-input',
        type: 'text',
        attr: { 'aria-label': 'partial tags seperated by spaces. Minus in front of a tag excludes it. eg "drawing -sketch fant" to include drawing and fantasy tags, but exclude sketches.', spellcheck: false, placeholder: 'Tags' }
      })

      tagFilterEl.addEventListener('input', async () =>
      {
        this.imageGrid.tag = tagFilterEl.value.trim();
        await this.updateData();
        this.updateDisplay();
      });

      // Filter Match Case
      const matchFilterDiv = filterBottomDiv.createDiv({
        cls: 'icon-toggle',
        attr: { 'aria-label': 'Should tags match exact case'}
      })
      setIcon(matchFilterDiv, "case-sensitive")

      matchFilterDiv.addEventListener('mousedown', async () =>
      {
        this.imageGrid.matchCase = !this.imageGrid.matchCase;
        if(this.imageGrid.matchCase)
        {
          matchFilterDiv.addClass("icon-checked");
        }
        else
        {
          matchFilterDiv.removeClass("icon-checked");
        }
        await this.updateData();
        this.updateDisplay();
      });

      // Filter Exclusive or inclusive
      const exclusiveFilterDiv = filterBottomDiv.createDiv({
        cls: 'icon-toggle',
        attr: { 'aria-label': 'Should tags match exact case'}
      })
      setIcon(exclusiveFilterDiv, "check-check")

      exclusiveFilterDiv.addEventListener('mousedown', async () =>
      {
        this.imageGrid.exclusive = !this.imageGrid.exclusive;
        if(this.imageGrid.exclusive)
        {
          exclusiveFilterDiv.addClass("icon-checked");
        }
        else
        {
          exclusiveFilterDiv.removeClass("icon-checked");
        }
        await this.updateData();
        this.updateDisplay();
      });

      // image width scaler
      this.widthScaleEl = filterBottomDiv.createEl("input", {
        cls: 'ob-gallery-filter-slider-input',
        type: 'range',
        attr: { 'aria-label': 'Change the display width of columns'}
      });
      this.widthScaleEl.name = 'maxWidth';
      this.widthScaleEl.id = 'maxWidth';
      this.widthScaleEl.min = '100';
      this.widthScaleEl.max = this.imagesContainer.innerWidth+"";
      this.widthScaleEl.value = this.imageGrid.maxWidth+"";
      this.widthScaleEl.addEventListener('input', async () =>
      {
        this.imageGrid.maxWidth = parseInt(this.widthScaleEl.value);
        if(this.imageGrid.haveColumnsChanged())
        {
          this.updateDisplay();
        }
      });

      // Add action button to show random options and randomize them
      const randomDiv = filterBottomDiv.createDiv();
      const randomButton = filterTopDiv.createEl('a', { cls: 'view-action', attr: { 'aria-label': 'Randomise images' } })
      setIcon(randomButton, 'dice')
      randomDiv.style.display = "none";
      randomDiv.style.marginLeft= "auto";
      this.#randomEl = randomDiv.createEl('input', {
        cls: 'ob-gallery-filter-input',
        type: 'number',
        attr: { 'aria-label': 'number of random images to grab', min:"1", value: "10" }
      })
      this.#randomEl.style.marginLeft= "auto";
      this.#randomEl.addEventListener("focus", async ()=>{
        await this.updateData();
        this.updateDisplay();
      })
      this.#randomEl.addEventListener("input", async ()=>{
        this.imageGrid.random = parseInt(this.#randomEl.value);
        await this.updateData();
        this.updateDisplay();
      })

      randomButton.onClickEvent(async () =>
      {
        const currentMode = randomDiv.style.getPropertyValue('display')
        if (currentMode === 'block')
        {
          randomDiv.style.setProperty('display', 'none')
          this.imageGrid.random = 0;
          this.imageGrid.customList = [];
          await this.updateData();
          this.updateDisplay();
          return;
        }
        randomDiv.style.setProperty('display', 'block')
        this.imageGrid.random = parseInt(this.#randomEl.value);
        await this.updateData();
        this.updateDisplay();
      });

      // Copy button functionality
      if(copyFilterButton)
      {
        setIcon(copyFilterButton, 'copy')

        copyFilterButton.onClickEvent(async () =>
        {
          await navigator.clipboard.writeText(this.imageGrid.getFilter());
        });
      }

      // paste button functionality
      if(pasteFilterButton)
      {
        setIcon(pasteFilterButton, 'paste')

        pasteFilterButton.onClickEvent(async () =>
        {
            const filterString = await navigator.clipboard.readText();
            this.imageGrid.setFilter(filterString);
            
            pathFilterEl.value = this.imageGrid.path;
            nameFilterEl.value = this.imageGrid.name;
            tagFilterEl.value = this.imageGrid.tag;
            this.widthScaleEl.value = this.imageGrid.maxWidth+"px";
            if(this.imageGrid.reverse)
            {
              sortReverseDiv.addClass("icon-checked");
            }
            else
            {
              sortReverseDiv.removeClass("icon-checked");
            }
            if(this.imageGrid.matchCase)
            {
              matchFilterDiv.addClass("icon-checked");
            }
            else
            {
              matchFilterDiv.removeClass("icon-checked");
            }
            if(this.imageGrid.exclusive)
            {
              exclusiveFilterDiv.addClass("icon-checked");
            }
            else
            {
              exclusiveFilterDiv.removeClass("icon-checked");
            }
            if(this.imageGrid.random > 0)
            {
              this.#randomEl.value = this.imageGrid.random+"";
              randomDiv.style.setProperty('display', 'block');
            }
            else
            {
              randomDiv.style.setProperty('display', 'none');
            }

            await this.updateData();
            this.updateDisplay();
        });
      }
    }

    
    this.imageGrid.updateResources();
  }

  async updateData()
  {
    await this.imageGrid.updateData();
    this.countEl.setText(this.imageGrid.imgList.length+"/"+this.imageGrid.totalCount);
    this.#randomEl.max = this.imageGrid.totalCount+"";
  }

  async updateDisplay()
  {
    this.imageGrid.updateDisplay();
  }

  getViewType(): string
  {
    return OB_GALLERY
  }

  getDisplayText(): string
  {
    return 'Gallery'
  }

  getIcon(): string
  {
    return 'lines-of-text'
  }

  onResize(): void
  {
    this.widthScaleEl.max = (this.imagesContainer.innerWidth+50)+"";
    this.updateDisplay();
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
    // Set Header Title
    this.headerEl.querySelector('.view-header-title').setText('Obsidian Gallery')
    
    this.imageGrid.path = this.plugin.settings.galleryLoadPath;
    this.imageGrid.name = "";
    this.imageGrid.tag = "";
    this.imageGrid.matchCase = false;
    this.imageGrid.exclusive = false;
    this.imageGrid.reverse = false;
    await this.updateData();
    this.updateDisplay();

    const infoView = await GalleryInfoView.OpenLeaf(this.plugin);
    
    // Add listener to change active file
    this.imageGrid.setupClickEvents(this.imageFocusEl, this.focusVideo, this.focusImage, infoView);
  }
}