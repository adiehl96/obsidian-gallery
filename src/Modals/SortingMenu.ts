import { Sorting, type ImageGrid } from "../DisplayObjects/ImageGrid";
import { MenuPopup } from "./MenuPopup"

export class SortingMenu extends MenuPopup
{
	#imageGrid: ImageGrid;

	constructor(posX:number, posY:number, imageGrid: ImageGrid)
	{
		super(posX, posY, (result) => {this.#submit(result)});

		this.#imageGrid = imageGrid;
		
		this.AddLabel('Change Sorting');
		this.addSeparator();

		this.addItem("File Name", "name");
		this.addItem("File Path", "path");
		this.addItem("Date Added", "cdate");
		this.addItem("Date Modified", "mdate");
		this.addItem("File Size", "size");

		this.addSeparator();
		this.addItem("Reverse", "flip");
	}

	async #submit(result:string)
	{
		switch(result)
		{
			case "name" : this.#imageGrid.updateSort(Sorting.NAME, false); break;
			case "cdate" : this.#imageGrid.updateSort(Sorting.CDATE, false); break;
			case "mdate" : this.#imageGrid.updateSort(Sorting.MDATE, false); break;
			case "path" : this.#imageGrid.updateSort(Sorting.PATH, false); break;
			case "size" : this.#imageGrid.updateSort(Sorting.SIZE, false); break;
			case "flip" : this.#imageGrid.updateSort(this.#imageGrid.sorting, !this.#imageGrid.reverse); break;
			default: return;
		}

		await this.#imageGrid.updateDisplay();
	}
}