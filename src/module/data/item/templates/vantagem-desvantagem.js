import { BaseItemTemplate } from "./common";

const fields = foundry.data.fields;
export class VantagemDesvantagemTemplate extends BaseItemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			afeta: new fields.SchemaField({
				poder: new fields.BooleanField({ initial: false }),
				habilidade: new fields.BooleanField({ initial: false }),
				resistencia: new fields.BooleanField({ initial: false }),
			}),
		};
	}

	get chatProperties() {
		const atributos = Object.entries(this.afeta)
			.map(([key, value]) => {
				if (value) return key.capitalize();
			})
			.filter((atr) => atr);
		return [...atributos];
	}
}
