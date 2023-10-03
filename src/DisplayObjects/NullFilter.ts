
import type { ImageGrid } from "./ImageGrid";
import type { IFilter } from "../TechnicalFiles/IFilter";

export class NullFilter implements IFilter
{
	containerEl: HTMLElement

	#imageGrid: ImageGrid

	constructor(containerEl:HTMLElement, imageGrid: ImageGrid)
	{
		if(!containerEl)
		{
		  return;
		}

		this.containerEl = containerEl;
		this.#imageGrid = imageGrid;

		this.containerEl.style.setProperty('display', 'none');
	}
	filterFill(): void
	{
		
	}
	onResize(): void
	{
		
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