// eslint-disable-next-line no-unused-vars
import { BaseItemData, createConcessao } from "./templates/common.js";

const fields = foundry.data.fields;

export default class VantagemData extends BaseItemData {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			custo: new fields.NumberField({ initial: 1, min: 0, max: null }),
			// TODO adicionar 3 checkboxes para indicar quais testes afeta, replicar na desvantagem
			afeta: new fields.ArrayField(new fields.BooleanField({ initial: false })),
		};
	}
}
