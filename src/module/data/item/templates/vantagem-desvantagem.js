import { BaseItemTemplate } from "./common.js";

const fields = foundry.data.fields;

/**
 * Dados compartilhados por Vantagens e Desvantagens.
 */
export class VantagemDesvantagemTemplate extends BaseItemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();

		return {
			...superFields,

			/**
			 * Indica de onde a Vantagem ou Desvantagem veio na construção
			 * do personagem.
			 *
			 * Exemplos:
			 * tipo: "arquetipo"
			 * nome: "Kemono"
			 *
			 * tipo: "kit"
			 * nome: "Combatente"
			 */
			origem: new fields.SchemaField({
				tipo: new fields.StringField({
					initial: "comprada",
				}),

				nome: new fields.StringField({
					initial: "",
				}),
			}),

			afeta: new fields.SchemaField({
				poder: new fields.BooleanField({
					initial: false,
				}),

				habilidade: new fields.BooleanField({
					initial: false,
				}),

				resistencia: new fields.BooleanField({
					initial: false,
				}),
			}),
		};
	}

	get chatProperties() {
		const atributos = Object.entries(this.afeta)
			.map(([key, value]) => {
				if (value) {
					return key.capitalize();
				}

				return "";
			})
			.filter((atributo) => atributo);

		return [...atributos];
	}
}
