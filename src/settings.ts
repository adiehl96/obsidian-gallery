import { type App, PluginSettingTab, Setting, TFolder } from 'obsidian'
import type GalleryTagsPlugin from './main'

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
    let resourcesPathInput = ''
    let onOpenPathInput = ''
    let imgmetaPathInput = ''
    let hiddenInfoInput = ''

    containerEl.empty()
    containerEl.createEl('h2', { text: 'Gallery Settings' })

    const infoPathSetting = new Setting(containerEl)
      .setName('Gallery Info Folder')
      .setDesc('')
      .addButton(text => text
        .setButtonText('Save')
        .onClick(() =>
        {
          if (resourcesPathInput === '/' || !(this.plugin.app.vault.getAbstractFileByPath(resourcesPathInput) instanceof TFolder))
          {
            return;
          }

          this.plugin.settings.imgDataFolder = resourcesPathInput
          resourcesPathInput = ''
          this.plugin.saveSettings()
        }))
      .addText(text => text
        .setPlaceholder(this.plugin.settings.imgDataFolder ?? '')
        .onChange(async (value) =>
        {
          resourcesPathInput = value.trim()
        }))

    infoPathSetting.descEl.createDiv({ text: 'Specify an existing vault folder for the gallery plugin to store image information/notes as markdown files.' })
    infoPathSetting.descEl.createDiv({ text: 'E.g. \`Resources/Gallery\`.', attr: { style: 'color: indianred;' } })
    infoPathSetting.descEl.createDiv({ text: 'On first activation the default is unspecified. Thus the info functionality of the Main gallery is diabled.' })
    infoPathSetting.descEl.createDiv({ text: 'Folder must already exist (plugin will not create it).', attr: { style: 'font-weight: 900;' } })
    infoPathSetting.descEl.createDiv({ text: 'If a folder is not specified no Image Information notes are created (to be used in the main gallery).' })

    new Setting(containerEl)
      .setName('Default Image Width')
      .setDesc('Display default image width in `pixels`. integer, placeholder shows current value. (change this value to change the display in the main gallery')
      .addText(text => text
        .setPlaceholder(`${this.plugin.settings.width}`)
        .onChange(async (value) =>
        {
          const numValue = parseInt(value)
          if (isNaN(numValue))
          {
            return;
          }

          this.plugin.settings.width = Math.abs(numValue)
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('Gallery On Open Path Search')
      .setDesc(`The path from which to show images when the main gallery is opened. 
            Setting it to \`/\` will show all images in the vault. 
            Can be used to avoid the loading all images and affecting on open performance 
            (especially if vault has a huge amount of high quality images). 
            Setting it to an invalid path to have no images shown when gallery is opened.`)
      .addButton(text => text
        .setButtonText('Save')
        .onClick(() =>
        {
          this.plugin.settings.galleryLoadPath = onOpenPathInput
          onOpenPathInput = ''
          this.plugin.saveSettings()
        }))
      .addText(text => text
        .setPlaceholder(this.plugin.settings.galleryLoadPath)
        .onChange(async (value) =>
        {
          onOpenPathInput = value.trim()
        }))
        
    const metaTemplatSetting = new Setting(containerEl)
      .setName('Meta file template override')
      .setDesc('')
      .addButton(text => text
        .setButtonText('Save')
        .onClick(async () =>
        {
          this.plugin.settings.imgmetaTemplatePath = imgmetaPathInput
          imgmetaPathInput = ''
          this.plugin.saveSettings()
          await this.plugin.loadMetaTemplate();
        }))
      .addText(text => text
        .setPlaceholder(this.plugin.settings.imgmetaTemplatePath)
        .onChange(async (value) =>
        {
          imgmetaPathInput = value.trim()
        }))
    metaTemplatSetting.descEl.createDiv({ text: 'Location of template file to use for generating image meta files. If blank will use default.' })
    metaTemplatSetting.descEl.createDiv({ text: 'These keys will be replaced with the apropriate info for the file:' })
    metaTemplatSetting.descEl.createDiv({ text: '<% IMG LINK %> : Clickable link to the image with its name as the text' })
    metaTemplatSetting.descEl.createDiv({ text: '<% IMG EMBED %> : Embeded view of the image' })
    metaTemplatSetting.descEl.createDiv({ text: '<% IMG INFO %> : Info block for the image' })
    metaTemplatSetting.descEl.createDiv({ text: '<% IMG URI %> : The formatted URI for the image that can be used to generate a link to it' })
    metaTemplatSetting.descEl.createDiv({ text: '<% IMG PATH %> : Path to the image(including file name)' })
    metaTemplatSetting.descEl.createDiv({ text: '<% IMG NAME %> : File name for the image' })

    new Setting(containerEl)
    .setName('Default Hidden Info')
    .setDesc(`When no hidden info items are specified in an image info block these info items will be hidden.`)
    .addButton(text => text
      .setButtonText('Save')
      .onClick(() =>
      {
        this.plugin.settings.hiddenInfo = hiddenInfoInput
        hiddenInfoInput = ''
        this.plugin.saveSettings()
      }))
    .addText(text => text
      .setPlaceholder(this.plugin.settings.hiddenInfo)
      .onChange(async (value) =>
      {
        hiddenInfoInput = value.trim()
      }))
  }
}
