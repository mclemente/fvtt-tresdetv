// eslint-disable-next-line no-unused-vars
import { BaseItemData, createConcessao } from "./common.js";

const fields = foundry.data.fields;

export default class DesvantagemData extends BaseItemData {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			custo: new fields.NumberField({ initial: -1, max: 0 }),
		};
	}
}
