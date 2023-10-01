export interface IFilter
{
	containerEl: HTMLElement
	countEl: HTMLLabelElement

	filterFill(): void
	onResize(): void
	updateData(): Promise<void>
	updateDisplay(): Promise<void>
}