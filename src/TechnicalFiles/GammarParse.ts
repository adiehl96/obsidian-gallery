import type { MediaSearch } from "./MediaSearch";

export enum Rules
{
	NAME = 'name',
	PATH = 'path',
	TAG = 'tag',
	REGEX = 'regex',
	FRONTMATTER = ''
}
export enum Mods
{
	EXPLICITE = '!',
	NEGATE = '-'
}

export type Rule = {
	rule:string
	item:string
}

export const parseAdvanceSearch = (input: string, mediaSearch:MediaSearch) =>
{
	const parts = input.split(/[ ,;\n\r]/);
	const rules:Rule[] = [];
	let rule : Rule;
	while(parts.length > 0)
	{
		let part = parts.shift().trim();

		if(part.contains(':'))
		{
			let id = part.substring(0,part.indexOf(':'));
			part = part.substring(part.indexOf(':')+1);

			if(rule!= null)
			{
				rules.push(rule);
				rule = null;
			}

			switch(id.toLowerCase())
			{
				case Rules.PATH : rule = {rule: Rules.PATH, item: ""}; break;
				case Rules.REGEX : rule = {rule: Rules.REGEX, item: ""}; break;
				case Rules.NAME : rule = {rule: Rules.NAME, item: ""}; break;
				case Rules.TAG : rule = {rule: Rules.TAG, item: ""};  break;
				default : rule = {rule: id, item: ""};  break;
			}
		}

		if(part != "")
		{
			if(rule == null)
			{
				rule = {rule: Rules.TAG, item: ""};
			}
			
			rule.item += " " + part;
		}
	}
	if(rule != null)
	{
		rules.push(rule);
	}

	mediaSearch.exclusive = false;
	mediaSearch.path = "";
	mediaSearch.name = "";
	mediaSearch.tag = "";
	mediaSearch.regex = "";

	for (let i = 0; i < rules.length; i++)
	{
		const item = rules[i];
		switch(item.rule)
		{
			case Rules.PATH : mediaSearch.path = item.item.trim(); break;
			case Rules.REGEX : mediaSearch.regex = item.item.trim(); break;
			case Rules.NAME : mediaSearch.name = item.item.trim(); break;
			case Rules.TAG : mediaSearch.tag = item.item.trim(); break;
			default: // TODO: Fronmatter searches aren't supported yet
		}
	}
}