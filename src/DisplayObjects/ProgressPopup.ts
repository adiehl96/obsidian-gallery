import { App, Modal, Setting } from "obsidian";
import type GalleryTagsPlugin from "../main";

export class ProgressModal extends Modal 
{
	#plugin: GalleryTagsPlugin
	#onCancel: () => void
	#complete: boolean = false
	#total: number
	#progressEl: HTMLDivElement

	constructor(plugin: GalleryTagsPlugin, total: number, onCancel: () => void) 
	{
		super(plugin.app);
		this.#plugin = plugin;
		this.#onCancel = onCancel;
		this.#total = total;
	}

	updateProgress(complete:number)
	{
		if(complete == this.#total-1)
		{
			this.#complete = true;
			this.close();
			return;
		}

		if(complete == 0)
		{
			return;
		}

		this.#progressEl.style.width = (complete*100/this.#total)+"%"
	}

	onOpen() 
	{
		const { contentEl } = this;

		const bar = contentEl.createDiv();
		bar.style.height = "25px"
		bar.style.width = "100%"
		bar.style.backgroundColor = "#333"

		this.#progressEl = bar.createDiv();
		this.#progressEl.style.height = "100%"
		this.#progressEl.style.width = "0%"
		this.#progressEl.style.backgroundColor = this.#plugin.accentColor

		if(this.#onCancel)
		{
			new Setting(contentEl)
			.addButton((btn) =>
			btn
			.setButtonText("Cancel")
			.setCta()
			.onClick(() => {
				this.#onCancel();
				this.#complete = true;
				this.close();
			}));
		}
	}

	onClose() 
	{
		if(!this.#complete && this.#onCancel)
		{
			this.#onCancel();
		}

		let { contentEl } = this;
		contentEl.empty();
	}
}