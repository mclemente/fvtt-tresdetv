// eslint-disable-next-line no-unused-vars
import { BaseItemData, createConcessao } from "./templates/common.js";

// eslint-disable-next-line no-unused-vars
const fields = foundry.data.fields;

export default class ItemData extends BaseItemData {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
		};
	}
}
