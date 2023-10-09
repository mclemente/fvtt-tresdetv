// eslint-disable-next-line no-unused-vars
import { BaseItemTemplate, createConcessao } from "./templates/common.js";

// eslint-disable-next-line no-unused-vars
const fields = foundry.data.fields;

export default class ItemData extends BaseItemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
		};
	}
}
