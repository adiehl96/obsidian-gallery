import { FuzzySuggestModal, TFile, TFolder, getAllTags } from "obsidian";

export class FuzzyFolders extends FuzzySuggestModal<TFolder>
{
	onSelection: (result:string) => void

	getItems(): TFolder[]
	{
		const files = this.app.vault.getAllLoadedFiles()
		const filtered = files.filter((f) => !(f instanceof TFile))
		return filtered.map((f) => f as TFolder)
	}
	getItemText(item: TFolder): string
	{
		return item.path
	}
	onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent): void
	{
		this.onSelection(item.path);
	}
}

export class FuzzyFiles extends FuzzySuggestModal<TFile>
{
	onSelection: (result:string) => void

	getItems(): TFile[]
	{
		const files = this.app.vault.getAllLoadedFiles()
		const filtered = files.filter((f) => (f instanceof TFile))
		return filtered.map((f) => f as TFile)
	}
	getItemText(item: TFile): string
	{
		return item.path
	}
	onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void
	{
		this.onSelection(item.path);
	}
}

export class FuzzyTags extends FuzzySuggestModal<string>
{
	onSelection: (result:string) => void

	getItems(): string[]
	{
		const files = this.app.vault.getMarkdownFiles();
		const allTags: string[] = []
		for(let i = 0; i < files.length; i++)
		{
			const tags = getAllTags(this.app.metadataCache.getFileCache(files[i]));
			for(let k = 0; k < tags.length; k++)
			{
				if(!allTags.contains(tags[k]))
				{
					allTags.push(tags[k])
				}
			}
		}
		return allTags
	}
	getItemText(item: string): string
	{
		return item
	}
	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void
	{
		this.onSelection(item);
	}
}