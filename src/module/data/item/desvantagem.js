// eslint-disable-next-line no-unused-vars
import { BaseItemData, createConcessao } from "./templates/common.js";

const fields = foundry.data.fields;

export default class DesvantagemData extends BaseItemData {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			custo: new fields.NumberField({ initial: -1, max: 0 }),
			afeta: new fields.ArrayField(new fields.BooleanField({ initial: false })),
		};
	}
}
