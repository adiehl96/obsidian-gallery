import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal 
{
	onConfirm: () => void
	onCancel: () => void
	confirmLabel: string = "OK"
	cancelLabel: string = "Cancel"
	#info: string

	constructor(app: App, info: string, onConfirm: () => void) 
	{
		super(app);
		this.onConfirm = onConfirm;
		this.#info = info;
	}

	onOpen() 
	{
		const { contentEl } = this;

		contentEl.createEl("h1", { text: this.#info });


		new Setting(contentEl)
		.addButton((btn) =>
		btn
		.setButtonText(this.confirmLabel)
		.setCta()
		.onClick(() => {
			this.close();
			this.onConfirm();
		}))
		.addButton((btn) =>
		btn
		.setButtonText(this.cancelLabel)
		.setCta()
		.onClick(() => {
			this.close();
			if(this.onCancel)
			{
				this.onCancel();
			}
		}));
	}

	onClose() 
	{
		let { contentEl } = this;
		contentEl.empty();
	}
}