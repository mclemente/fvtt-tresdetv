// eslint-disable-next-line no-unused-vars
import { BaseItemData, createConcessao } from "./templates/common.js";

const fields = foundry.data.fields;

export default class TecnicaData extends BaseItemData {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
			// ...createConcessao(),
			custo: new fields.NumberField({ initial: 1, min: 0, max: null }),
			ativacao: new fields.SchemaField({
				requisitos: new fields.StringField({ initial: "" }),
				alcance: new fields.StringField({ initial: "" }),
				custo: new fields.NumberField({ initial: 0, max: null }),
				teste: new fields.StringField({ initial: "" }),
			}),
			duracao: new fields.SchemaField({
				value: new fields.NumberField({ initial: 0 }),
				unidade: new fields.StringField({ initial: "" }),
				especial: new fields.StringField({ initial: "" }),
			}),
		};
	}
}
