import { loc } from "../Loc/Localizer";
import { Sorting, type ImageGrid } from "../DisplayObjects/ImageGrid";
import { MenuPopup } from "./MenuPopup"

enum SortOptions
{
	NAME = 1,
	PATH = 2,
	CDATE = 3,
	MDATE = 4,
	SIZE = 5,
	FLIP = 6
}

export class SortingMenu extends MenuPopup
{
	#imageGrid: ImageGrid;

	constructor(posX:number, posY:number, imageGrid: ImageGrid)
	{
		super(posX, posY, (result) => {this.#submit(result)});

		this.#imageGrid = imageGrid;
		
		this.AddLabel(loc('SORT_HEADER'));
		this.addSeparator();

		this.#createItem(SortOptions.NAME);
		this.#createItem(SortOptions.PATH);
		this.#createItem(SortOptions.CDATE);
		this.#createItem(SortOptions.MDATE);
		this.#createItem(SortOptions.SIZE);

		this.addSeparator();
		this.#createItem(SortOptions.FLIP);

		this.show(posX,posY);
	}

	#createItem(option:SortOptions)
	{
		//@ts-ignore
		const label = loc("SORT_OPTION_"+option);
		let sorting : Sorting;
		switch(option)
		{
			case SortOptions.NAME: sorting = Sorting.NAME; break;
			case SortOptions.PATH: sorting = Sorting.PATH; break;
			case SortOptions.CDATE: sorting = Sorting.CDATE; break;
			case SortOptions.MDATE: sorting = Sorting.MDATE; break;
			case SortOptions.SIZE: sorting = Sorting.SIZE; break;
			case SortOptions.FLIP: sorting = Sorting.UNSORTED; break;
		}
		
		let color: string = null;
		if(sorting == this.#imageGrid.sorting)
		{
			color = this.#imageGrid.plugin.accentColor;
		}
		if(option == SortOptions.FLIP)
		{
			color = this.#imageGrid.reverse ? this.#imageGrid.plugin.accentColor : null;
		}

		this.addItem(label, SortOptions[option], color);
	}


	async #submit(result:string)
	{
		switch(result)
		{
			case SortOptions[SortOptions.NAME] : this.#imageGrid.updateSort(Sorting.NAME, false); break;
			case SortOptions[SortOptions.CDATE] : this.#imageGrid.updateSort(Sorting.CDATE, false); break;
			case SortOptions[SortOptions.MDATE] : this.#imageGrid.updateSort(Sorting.MDATE, false); break;
			case SortOptions[SortOptions.PATH] : this.#imageGrid.updateSort(Sorting.PATH, false); break;
			case SortOptions[SortOptions.SIZE] : this.#imageGrid.updateSort(Sorting.SIZE, false); break;
			case SortOptions[SortOptions.FLIP] : this.#imageGrid.updateSort(this.#imageGrid.sorting, !this.#imageGrid.reverse); break;
			default: return;
		}

		await this.#imageGrid.updateDisplay();
	}
}