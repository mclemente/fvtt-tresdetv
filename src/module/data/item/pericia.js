// eslint-disable-next-line no-unused-vars
import { BaseItemData, createConcessao } from "./templates/common.js";

const fields = foundry.data.fields;

export default class PericiaData extends BaseItemData {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			custo: new fields.NumberField({ initial: 1, min: 0, max: null }),
			especializacao: new fields.BooleanField(),
			maestria: new fields.BooleanField(),
		};
	}
}
