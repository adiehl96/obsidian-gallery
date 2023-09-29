import { type App, PluginSettingTab, Setting } from 'obsidian'
import type GalleryTagsPlugin from './main'
import { FuzzyFiles, FuzzyFolders } from './Modals/FuzzySearches'
import { DEFAULT_HIDDEN_INFO } from './TechnicalFiles/Constants'
import { loc } from './Loc/Localizer'


export class GallerySettingTab extends PluginSettingTab
{
  plugin: GalleryTagsPlugin

  constructor(app: App, plugin: GalleryTagsPlugin)
  {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void
  {
    const { containerEl } = this
    let hiddenInfoInput = ''
    let fuzzyFolders = new FuzzyFolders(this.app)
    let fuzzyFiles = new FuzzyFiles(this.app)


    containerEl.empty()

    // Main gallery path
    new Setting(containerEl)
    .setName(loc('SETTING_DATA_REFRESH_TITLE'))
    .setDesc(loc('SETTING_DATA_REFRESH_DESC'))
    .addButton(text => text
      .setButtonText(loc('SETTING_DATA_REFRESH_BUTTON'))
      .onClick(() =>
      {
        this.plugin.buildCaches(); 
      }));

    // Main gallery path
    const galleryOpenPathSetting = new Setting(containerEl)
    .setName(loc('SETTING_MAIN_PATH_TITLE'))
    .setDesc(loc('SETTING_MAIN_PATH_DESC'))
    .addButton(text => text
      .setButtonText(this.plugin.settings.galleryLoadPath)
      .onClick(() =>
      {
        fuzzyFolders.onSelection = (s) =>{
          this.plugin.settings.galleryLoadPath = s
          galleryOpenPathSetting.settingEl.querySelector('button').textContent = this.plugin.settings.galleryLoadPath
          this.plugin.saveSettings()
        }

        fuzzyFolders.open()
      }))
    
    // Unique Mobile Settings
    new Setting(containerEl)
      .setName(loc('SETTING_UNIQUE_MOBILE_TITLE'))
      .setDesc(loc('SETTING_UNIQUE_MOBILE_DESC'))
      .addToggle((toggle) =>
      {
        toggle.setValue(this.plugin.settings.uniqueMobileSettings)
        toggle.onChange(async (value) =>
        {
          this.plugin.settings.uniqueMobileSettings = value
          await this.plugin.saveSettings()
        });
      })
    
    // Platform Specific Section
    containerEl.createEl('h2', { text: loc('SETTING_PLATFORM_HEADER') })

    // Should right click open the side panel anywhere in the app?
    new Setting(containerEl)
      .setName(loc('SETTING_CONTEXT_INFO_TITLE'))
      .setDesc(loc('SETTING_CONTEXT_INFO_DESC'))
      .addToggle((toggle) =>
      {
        toggle.setValue(this.plugin.platformSettings().rightClickInfo)
        toggle.onChange(async (value) =>
        {
          this.plugin.platformSettings().rightClickInfo = value
          await this.plugin.saveSettings()
        });
      })

    // Should right click open the image menu anywhere in the app?
    new Setting(containerEl)
      .setName(loc('SETTING_CONTEXT_MENU_TITLE'))
      .setDesc(loc('SETTING_CONTEXT_MENU_DESC'))
      .addToggle((toggle) =>
      {
        toggle.setValue(this.plugin.platformSettings().rightClickMenu)
        toggle.onChange(async (value) =>
        {
          this.plugin.platformSettings().rightClickMenu = value
          await this.plugin.saveSettings()
        });
      })

    // Gallery search bar
    new Setting(containerEl)
      .setName(loc('SETTING_FILTER_OPEN_TITLE'))
      .setDesc(loc('SETTING_FILTER_OPEN_DESC'))
      .addToggle((toggle) =>
      {
        toggle.setValue(this.plugin.platformSettings().filterStartOpen)
        toggle.onChange(async (value) =>
        {
          this.plugin.platformSettings().filterStartOpen = value
          await this.plugin.saveSettings()
        });
      })

    // Default image width
    new Setting(containerEl)
      .setName(loc('SETTING_IMAGE_WIDTH_TITLE'))
      .setDesc(loc('SETTING_IMAGE_WIDTH_DESC'))
      .addText(text => text
        .setPlaceholder(`${this.plugin.platformSettings().width}`)
        .onChange(async (value) =>
        {
          const numValue = parseInt(value)
          if (isNaN(numValue))
          {
            return;
          }

          this.plugin.platformSettings().width = Math.abs(numValue)
          await this.plugin.saveSettings()
        }))
     
    
    // Use max height?
    new Setting(containerEl)
      .setName(loc('SETTING_MAX_HEIGHT_TOGGLE_TITLE'))
      .setDesc(loc('SETTING_MAX_HEIGHT_TOGGLE_DESC'))
      .addToggle((toggle) =>
      {
        toggle.setValue(this.plugin.platformSettings().useMaxHeight)
        toggle.onChange(async (value) =>
        {
          this.plugin.platformSettings().useMaxHeight = value;
          await this.plugin.saveSettings();
          this.display();
        });
      })

    // Max image height
    if(this.plugin.platformSettings().useMaxHeight)
    {
      new Setting(containerEl)
      .setName(loc('SETTING_MAX_HEIGHT_TITLE'))
      .setDesc(loc('SETTING_MAX_HEIGHT_DESC'))
      .addText(text => text
        .setPlaceholder(`${this.plugin.platformSettings().maxHeight}`)
        .onChange(async (value) =>
        {
          const numValue = parseInt(value)
          if (isNaN(numValue))
          {
            return;
          }

          this.plugin.platformSettings().maxHeight = Math.abs(numValue)
          await this.plugin.saveSettings()
        }))
    }
    
    // Gallery Meta Section
    containerEl.createEl('h2', { text: loc('SETTING_METADATA_HEADER') })
    
    // Gallery meta folder
    const infoPathSetting = new Setting(containerEl)
      .setName(loc('SETTING_META_FOLDER_TITLE'))
      .setDesc('')
      .addButton(text => text
        .setButtonText(this.plugin.settings.imgDataFolder)
        .onClick(() =>
        {
          fuzzyFolders.onSelection = (s) =>{
            this.plugin.settings.imgDataFolder = s
            infoPathSetting.settingEl.querySelector('button').textContent = this.plugin.settings.imgDataFolder
            this.plugin.saveSettings()
          }

          fuzzyFolders.open()
        }))
        
    infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC1') })
    infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC2'), attr: { style: 'color: indianred;' } })
    infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC3') })
    infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC4'), attr: { style: 'font-weight: 900;' } })
    infoPathSetting.descEl.createDiv({ text: loc('SETTING_META_FOLDER_DESC5') })
    
    // Should add keys even if they already exist
    new Setting(containerEl)
      .setName(loc('SETTING_QUICK_IMPORT_TITLE'))
      .setDesc(loc('SETTING_QUICK_IMPORT_DESC'))
      .addToggle((toggle) =>
      {
        toggle.setValue(this.plugin.settings.skipMetadataOverwrite)
        toggle.onChange(async (value) =>
        {
          this.plugin.settings.skipMetadataOverwrite = value
          await this.plugin.saveSettings()
        });
      })

    // Meta template file    
    const metaTemplatSetting = new Setting(containerEl)
      .setName(loc('SETTING_META_TEMPLATE_TITLE'))
      .setDesc('')
      .addButton(text => text
        .setButtonText(this.plugin.settings.imgmetaTemplatePath)
        .onClick(() =>
        {
          fuzzyFiles.onSelection = (s) =>{
            this.plugin.settings.imgmetaTemplatePath = s.substring(0,s.length-3)
            metaTemplatSetting.settingEl.querySelector('button').textContent = this.plugin.settings.imgmetaTemplatePath
            this.plugin.saveSettings()
          }

          fuzzyFiles.open()
        }))
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC1') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC2') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC3') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC4') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC5') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC6') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC7') });
    metaTemplatSetting.descEl.createDiv({ text: loc('SETTING_META_TEMPLATE_DESC8') });
    
    // Hidden meta fields
    const hiddenInfoSetting = new Setting(containerEl)
      .setName(loc('SETTING_HIDDEN_INFO_TITLE'))
      .setTooltip(loc('SETTING_HIDDEN_INFO_DESC'))
      .setDesc(``)
      .addText(text => text
        .setPlaceholder(loc('SETTING_HIDDEN_INFO_PLACEHOLDER'))
        .onChange(async (value) =>
        {
          value = value.trim();
          hiddenInfoInput = value;
        }))
      .addButton(text => text
        .setIcon("plus")
        .setTooltip(loc('SETTING_HIDDEN_INFO_ADD'))
        .onClick(() =>
        {
          this.plugin.settings.hiddenInfoTicker[hiddenInfoInput] = true;
          hiddenInfoInput = '';
          this.plugin.saveSettings();
          this.display();
        }))
      .addButton(text => text
        .setIcon('rotate-ccw')
        .setTooltip(loc('SETTING_HIDDEN_INFO_RESET'))
        .onClick(() =>
        {
          this.plugin.settings.hiddenInfoTicker = Object.assign({}, DEFAULT_HIDDEN_INFO);
          this.plugin.saveSettings();
          this.display();
        }));
      
    this.drawInfoLists(hiddenInfoSetting.descEl);
  }

  drawInfoLists(containerEl:HTMLElement)
  {
    const fields = Object.keys(this.plugin.settings.hiddenInfoTicker)
    for (let i = 0; i < fields.length; i++) 
    {
      const element = fields[i];
      new Setting(containerEl)
        .setName(fields[i])
        .addToggle((toggle) =>
        {
          toggle.setValue(this.plugin.settings.hiddenInfoTicker[fields[i]])
          toggle.onChange(async (value) =>
          {
            this.plugin.settings.hiddenInfoTicker[fields[i]] = value;
            await this.plugin.saveSettings();
          });
        })
        .addButton(text => 
        {
          text
          .setIcon("trash-2")
          .setTooltip(loc('SETTING_HIDDEN_INFO_REMOVE'))
          .onClick(async () => 
          {
            delete this.plugin.settings.hiddenInfoTicker[fields[i]];
            await this.plugin.saveSettings();
            this.display();
          })
        })
    }
    
  }
}
