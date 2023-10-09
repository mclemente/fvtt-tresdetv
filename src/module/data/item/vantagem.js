// eslint-disable-next-line no-unused-vars
import { createConcessao } from "./templates/common.js";
import { VantagemDesvantagemTemplate } from "./templates/vantagem-desvantagem.js";

const fields = foundry.data.fields;

export default class VantagemData extends VantagemDesvantagemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			custo: new fields.NumberField({ initial: 1, min: 0, max: null }),
		};
	}
}
