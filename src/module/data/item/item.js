import { BaseItemTemplate } from "./templates/common.js";

const fields = foundry.data.fields;

export default class ItemData extends BaseItemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			quantidade: new fields.NumberField({ required: true, initial: 1, min: 0 }),
			valor: new fields.NumberField({ required: true, initial: 0, min: 0 }),
		};
	}
}
