import { BaseItemTemplate } from "./templates/common.js";

const fields = foundry.data.fields;

export default class TecnicaData extends BaseItemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();
		return {
			...superFields,
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

	get chatProperties() {
		const { alcance, custo, teste } = this.ativacao;
		const { value, unidade } = this.duracao;
		return [
			alcance ? `Alcance: ${alcance}` : "",
			custo ? `Custo: ${custo}` : "",
			teste ? CONFIG.TRESDETV.atributos[teste] : "",
			value && unidade ? `${value} ${unidade}` : "",
		];
	}
}
