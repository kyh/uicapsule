import { Properties } from "components/Properties";
export { ControlType } from "components/Properties";

export type DocsMeta = {
	title: string;
	description: string;
	componentImport: string;
	typeImport: string;
	relatedComponents?: Array<{
		name: string;
		url: string;
	}>;
	storybookUrl?: string;
	properties: {
		base: Properties;
	} & Record<string, Properties>;
};
