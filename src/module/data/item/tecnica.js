import { BaseItemTemplate } from "./templates/common.js";

const fields = foundry.data.fields;

const TECHNIQUE_TIER_LABELS = Object.freeze({
	truque: "Truque",
	comum: "Técnica Comum",
	lendaria: "Técnica Lendária",
});

/**
 * Modelo de dados das Técnicas de 3DeT Victory.
 */
export default class TecnicaData extends BaseItemTemplate {
	static defineSchema() {
		const superFields = super.defineSchema();

		return {
			...superFields,

			/**
			 * Classificação da Técnica.
			 *
			 * Valores possíveis:
			 * - truque
			 * - comum
			 * - lendaria
			 *
			 * Técnicas antigas são tratadas como comuns.
			 */
			categoria: new fields.StringField({
				initial: "comum",
			}),

			custo: new fields.NumberField({
				initial: 1,
				min: 0,
				max: null,
			}),

			ativacao: new fields.SchemaField({
				requisitos: new fields.StringField({
					initial: "",
				}),

				alcance: new fields.StringField({
					initial: "",
				}),

				custo: new fields.NumberField({
					initial: 0,
					min: 0,
					max: null,
				}),

				teste: new fields.StringField({
					initial: "",
				}),
			}),

			duracao: new fields.SchemaField({
				value: new fields.NumberField({
					initial: 0,
					min: 0,
				}),

				unidade: new fields.StringField({
					initial: "",
				}),

				especial: new fields.StringField({
					initial: "",
				}),
			}),
		};
	}

	/**
	 * Propriedades exibidas no cartão de chat.
	 *
	 * @returns {string[]}
	 */
	get chatProperties() {
		const { alcance, custo, teste } = this.ativacao;

		const { value, unidade } = this.duracao;

		const tierLabel = TECHNIQUE_TIER_LABELS[this.categoria] ?? TECHNIQUE_TIER_LABELS.comum;

		return [
			tierLabel,

			alcance ? `Alcance: ${alcance}` : "",

			custo ? `Custo: ${custo}PM` : "",

			teste ? CONFIG.TRESDETV.atributos[teste] : "",

			value && unidade ? `${value} ${unidade}` : "",
		].filter(Boolean);
	}
}
