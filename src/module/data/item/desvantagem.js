import { VantagemDesvantagemTemplate } from "./templates/vantagem-desvantagem.js";

const fields = foundry.data.fields;

export default class DesvantagemData extends VantagemDesvantagemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			custo: new fields.NumberField({ initial: -1, max: 0 }),
		};
	}
}
