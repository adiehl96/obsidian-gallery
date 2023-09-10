import { ItemView, type WorkspaceLeaf, setIcon, MarkdownRenderer, TFile } from 'obsidian'
import
  {
    OB_GALLERY, OB_GALLERY_INFO, GALLERY_RESOURCES_MISSING, VIDEO_REGEX, getImgInfo, updateFocus
  } from './utils'
import * as CodeMirror from 'codemirror'
import { ImageGrid } from './DisplayObjects/ImageGrid'
import type GalleryTagsPlugin from './main'

export class GalleryView extends ItemView
{
  plugin: GalleryTagsPlugin
  headerEl: HTMLElement 
  viewEl: HTMLElement 
  controlEl: HTMLElement 
  displayEl: HTMLElement
  filterEl: HTMLElement
  countEl: HTMLLabelElement
  imageFocusEl: HTMLElement
  focusImage: HTMLImageElement
  focusVideo: HTMLVideoElement
  imagesContainer: HTMLUListElement
  imgFocusIndex: number
  pausedVideo: HTMLVideoElement 
  pausedVideoUrl: string = ''
  imageGrid: ImageGrid
  widthScaleEl: HTMLInputElement

  constructor(leaf: WorkspaceLeaf, plugin: GalleryTagsPlugin)
  {
    super(leaf)
    this.plugin = plugin

    this.updateDisplay = this.updateDisplay.bind(this)
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
    this.imageGrid = new ImageGrid(this.imagesContainer, plugin);

    this.imageFocusEl = this.displayEl.createDiv({ cls: 'ob-gallery-image-focus', attr: { style: 'display: none;' } })
    const focusElContainer = this.imageFocusEl.createDiv({ attr: { class: 'focus-element-container' } })
    this.focusImage = focusElContainer.createEl('img', { attr: { style: 'display: none;' } })
    this.focusVideo = focusElContainer.createEl('video', { attr: { controls: 'controls', src: ' ', style: 'display: none; margin:auto;' } })
    this.imgFocusIndex = 0

    if(this.filterEl)
    {
      const filterTopDiv = this.filterEl.createDiv();
      const filterBottomDiv = this.filterEl.createDiv();

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
        cls: 'ob-gallery-filter-checkbox',
        attr: { 'aria-label': 'Should the sort order be reversed'}
      })
      const sortReverseEl = sortReverseDiv.createEl('input', {
        cls: 'ob-gallery-filter-checkbox-input',
        type: 'checkbox'
      })
      sortReverseEl.name = 'sortReverse'
      sortReverseEl.id = 'sortReverse'

      const sortReverseLabelEl = sortReverseDiv.createEl('label');
      sortReverseLabelEl.textContent = "Flip";
      sortReverseLabelEl.htmlFor = "sortReverse"

      sortReverseEl.addEventListener('input', async () =>
      {
        this.imageGrid.reverse = sortReverseEl.checked;
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
        cls: 'ob-gallery-filter-checkbox',
        attr: { 'aria-label': 'Should tags match exact case'}
      })
      const matchFilterEl = matchFilterDiv.createEl('input', {
        cls: 'ob-gallery-filter-checkbox-input',
        type: 'checkbox'
      })
      matchFilterEl.name = 'match'
      matchFilterEl.id = 'match'

      const matchFilterLabelEl = matchFilterDiv.createEl('label');
      matchFilterLabelEl.textContent = "Aa";
      matchFilterLabelEl.htmlFor = "match"

      matchFilterEl.addEventListener('input', async () =>
      {
        this.imageGrid.matchCase = matchFilterEl.checked;
        await this.updateData();
        this.updateDisplay();
      });

      // Filter Exclusive or inclusive
      const exclusiveFilterDiv = filterBottomDiv.createDiv({
        cls: 'ob-gallery-filter-checkbox',
        attr: { 'aria-label': 'When set will only include results that contain ALL of the tags listed. Otherwise the search is for ANY except those that contain explicit exclusions(eg -fan)'}
      })
      const exclusiveFilterEl = exclusiveFilterDiv.createEl('input', {
        cls: 'ob-gallery-filter-checkbox-input',
        type: 'checkbox'
      })
      exclusiveFilterEl.name = 'exclusive'
      exclusiveFilterEl.id = 'exclusive'

      const exclusiveFilterLabelEl = exclusiveFilterDiv.createEl('label');
      exclusiveFilterLabelEl.textContent = "All";
      exclusiveFilterLabelEl.htmlFor = "exclusive"

      exclusiveFilterEl.addEventListener('input', async () =>
      {
        this.imageGrid.exclusive = exclusiveFilterEl.checked;
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

      // Copy button functionality
      if(copyFilterButton)
      {
        setIcon(copyFilterButton, 'copy')

        copyFilterButton.onClickEvent(async () =>
        {
          let filterCopy = "```gallery"
          filterCopy += "\npath=" + pathFilterEl.value.trim();
          filterCopy += "\nname=" + nameFilterEl.value.trim();
          filterCopy += "\ntags=" + tagFilterEl.value.trim();
          filterCopy += "\nmatchCase=" + matchFilterEl.checked;
          filterCopy += "\nexclusive=" + exclusiveFilterEl.checked;
          filterCopy += "\nimgWidth=" + parseInt(this.widthScaleEl.value);
          filterCopy += "\nreverseOrder=" + sortReverseEl.checked;
          filterCopy += "\n```"

          await navigator.clipboard.writeText(filterCopy);
        });
      }

      // paste button functionality
      if(pasteFilterButton)
      {
        setIcon(pasteFilterButton, 'paste')

        pasteFilterButton.onClickEvent(async () =>
        {
            const filterString = await navigator.clipboard.readText();
            const lines = filterString.split('\n');
            for(let i = 0; i < lines.length; i++)
            {
              const parts = lines[i].split('=');
              if(parts.length <2)
              {
                continue;
              }

              switch(lines[i][0])
              {
                case '`' : continue;
                case 'p' : 
                pathFilterEl.value = parts[1]; 
                this.imageGrid.path = parts[1];
                break;
                case 'n' : 
                nameFilterEl.value = parts[1]; 
                this.imageGrid.name = parts[1];
                break;
                case 't' : 
                tagFilterEl.value = parts[1]; 
                this.imageGrid.tag = parts[1];
                break;
                case 'm' : 
                matchFilterEl.checked = (parts[1] === "true"); 
                this.imageGrid.matchCase = (parts[1] === "true");
                break;
                case 'e' : 
                exclusiveFilterEl.checked = (parts[1] === "true"); 
                this.imageGrid.exclusive = (parts[1] === "true");
                break;
                case 'i' : 
                this.widthScaleEl.value = parts[1]; 
                this.imageGrid.maxWidth = parseInt(parts[1]);
                break;
                case 'r' : 
                sortReverseEl.checked = (parts[1] === "true"); 
                this.imageGrid.reverse = (parts[1] === "true");
                break;
                default : continue;
              }
            }

            await this.updateData();
            this.updateDisplay();
        });
      }
    }
  }

  async updateData()
  {
    await this.imageGrid.updateData();
    this.countEl.setText(this.imageGrid.imgList.length+"/"+this.imageGrid.totalCount);
  }

  updateDisplay()
  {
    this.imagesContainer.empty()

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
    this.imageFocusEl.style.setProperty('display', 'none')
    this.app.workspace.detachLeavesOfType(OB_GALLERY_INFO)
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

    // Open Info panel
    const workspace = this.app.workspace
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
    workspace.revealLeaf(
      await workspace.getLeavesOfType(OB_GALLERY_INFO)[0]
    );
  }
}

export class GalleryInfoView extends ItemView
{
  viewEl: HTMLElement
  contentEl: HTMLElement
  previewEl: HTMLElement
  sourceEl: HTMLElement
  editorEl: HTMLTextAreaElement
  infoFile: TFile | null = null
  imgPath: string
  galleryView: GalleryView
  plugin: GalleryTagsPlugin
  editor: CodeMirror.Editor

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
    this.sourceEl = this.viewEl.createDiv({ cls: 'CodeMirror cm-s-obsidian CodeMirror-wrap', attr: { style: 'display: none' } })
    // Add code mirro editor
    this.editorEl = this.sourceEl.createEl('textarea', { cls: 'image-info-cm-editor' })
    // Create Code Mirror Editor with specific config
    this.editor = CodeMirror.fromTextArea(this.editorEl, {
      lineNumbers: false,
      lineWrapping: true,
      scrollbarStyle: null,
      keyMap: 'default'
    })
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
    // Add listener to change active file
    const gallery = this.app.workspace.getLeavesOfType(OB_GALLERY)[0]
    if (gallery?.view instanceof GalleryView)
    {
      this.galleryView = gallery.view
      const displayEl = this.galleryView.displayEl

      displayEl.onclick = async (evt) =>
      {
        const currentMode = this.galleryView.imageFocusEl.style.getPropertyValue('display')
        if (currentMode === 'block')
        {
          this.galleryView.imageFocusEl.style.setProperty('display', 'none')
          // Clear Focus video
          this.galleryView.focusVideo.src = ''
          // Clear Focus image
          this.galleryView.focusImage.src = ''
          // Set Video Url back to disabled grid video
          if (this.galleryView.pausedVideo)
          {
            this.galleryView.pausedVideo.src = this.galleryView.pausedVideoUrl
          }
          // Hide focus image div
          this.galleryView.focusImage.style.setProperty('display', 'none')
          // Hide focus video div
          this.galleryView.focusVideo.style.setProperty('display', 'none')
          return;
        }

        if (evt.target instanceof HTMLImageElement)
        {
          // Read New image info
          this.imgPath = evt.target.src
          this.galleryView.imgFocusIndex = this.galleryView.imageGrid.imgList.indexOf(this.imgPath)
          this.galleryView.imageFocusEl.style.setProperty('display', 'block')
          updateFocus(this.galleryView.focusImage, this.galleryView.focusVideo,
            this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex], false)

          await this.updateInfoDisplay()
        }

        if (evt.target instanceof HTMLVideoElement)
        {
          // Read video info
          this.imgPath = evt.target.src
          this.galleryView.imgFocusIndex = this.galleryView.imageGrid.imgList.indexOf(this.imgPath)
          this.galleryView.imageFocusEl.style.setProperty('display', 'block')
          // Save clicked video info to set it back later
          this.galleryView.pausedVideo = evt.target
          this.galleryView.pausedVideoUrl = this.galleryView.pausedVideo.src
          // disable clicked video
          this.galleryView.pausedVideo.src = ''
          updateFocus(this.galleryView.focusImage, this.galleryView.focusVideo,
            this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex], true)

          await this.updateInfoDisplay()
        }
      };

      displayEl.addEventListener('contextmenu', async (e) =>
      {
        if (e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement)
        {
          // Clear the preview and editor history
          this.clear()

          // Open image file
          const file = this.app.vault.getAbstractFileByPath(this.galleryView.imageGrid.imgResources[e.target.src])
          if (file instanceof TFile)
          {
            this.app.workspace.getLeaf(false).openFile(file)
          }
        }
      })

      document.addEventListener('keyup', async (event) =>
      {
        if (this.galleryView.imageFocusEl.style.getPropertyValue('display') != 'block')
        {
          return;
        }

        if (this.sourceEl.style.getPropertyValue('display') === 'block')
        {
          return;
        }

        switch (event.key)
        {
          case 'ArrowLeft':
            this.galleryView.imgFocusIndex--
            if (this.galleryView.imgFocusIndex < 0)
            {
              this.galleryView.imgFocusIndex = this.galleryView.imageGrid.imgList.length - 1
            }
            if (this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex].match(VIDEO_REGEX))
            {
              updateFocus(this.galleryView.focusImage, this.galleryView.focusVideo,
                this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex], true)
            }
            else
            {
              updateFocus(this.galleryView.focusImage, this.galleryView.focusVideo,
                this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex], false)
            }
            break;
          case 'ArrowRight':
            this.galleryView.imgFocusIndex++
            if (this.galleryView.imgFocusIndex >= this.galleryView.imageGrid.imgList.length)
            {
              this.galleryView.imgFocusIndex = 0
            }
            if (this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex].match(VIDEO_REGEX))
            {
              updateFocus(this.galleryView.focusImage, this.galleryView.focusVideo,
                this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex], true)
            }
            else
            {
              updateFocus(this.galleryView.focusImage, this.galleryView.focusVideo,
                this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex], false)
            }
            break;
        }

        // Read New image info
        this.imgPath = this.galleryView.imageGrid.imgList[this.galleryView.imgFocusIndex]
        await this.updateInfoDisplay()
      }, false)
    }
  }

  async onOpen(): Promise<void>
  {
    // Control to change between preview / source modes
    const changeMode = this.viewEl.createEl('a',
      {
        cls: 'view-action image-info-edit',
        attr: { 'aria-label': 'Edit' }
      })
    setIcon(changeMode, 'pencil')

    const openInfo = this.viewEl.createEl('a',
      {
        cls: 'fa fa-external-link view-action image-info-open',
        attr: { 'aria-label': 'Open Info', style: 'float: right; padding-top: 10px; color: var(--text-normal);' }
      })

    changeMode.onClickEvent(() =>
    {
      const currentMode = this.previewEl.style.getPropertyValue('display')
      if (currentMode === 'block')
      {
        this.previewEl.style.setProperty('display', 'none')
        this.sourceEl.style.setProperty('display', 'block')
        this.editor.refresh()
        return;
      }

      this.render()
      this.previewEl.style.setProperty('display', 'block')
      this.sourceEl.style.setProperty('display', 'none')
    });

    openInfo.onClickEvent(() =>
    {
      // Set workspace leaf to info file
      if (this.infoFile)
      {
        this.app.workspace.getLeaf(false).openFile(this.infoFile)
      }
    })
  }

  async updateInfoDisplay()
  {
    this.infoFile = await getImgInfo(this.galleryView.imageGrid.imgResources[this.imgPath],
      this.app.vault,
      this.app.metadataCache,
      this.plugin,
      true)

    // Handle disabled img info functionality or missing info block
    let infoText = GALLERY_RESOURCES_MISSING
    if (this.infoFile)
    {
      infoText = await this.app.vault.cachedRead(this.infoFile)
    }

    // Clear the preview and editor history
    this.clear()

    // Set Editor to new file content
    this.editor.setValue(infoText)
    this.render()
  }

  async render(): Promise<void>
  {
    this.contentEl.empty()
    MarkdownRenderer.render(this.app, this.editor.getValue(), this.contentEl, '/', this)
  }

  clear(): void
  {
    this.contentEl.empty()
    this.editor.setValue('')
    this.editor.clearHistory()
  }
}
