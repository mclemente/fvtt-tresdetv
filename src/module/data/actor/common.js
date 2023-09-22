import { createAttributeField, createPointsField } from "../shared";

const fields = foundry.data.fields;

export class ActorData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			descricao: new fields.HTMLField(),
			atributos: new fields.SchemaField({
				poder: new fields.SchemaField(createAttributeField()),
				habilidade: new fields.SchemaField(createAttributeField()),
				resistencia: new fields.SchemaField(createAttributeField()),
			}),
			pontos: new fields.SchemaField({
				acao: new fields.SchemaField({
					...createPointsField(),
					mult: new fields.NumberField({
						required: true,
						initial: 1,
					}),
				}),
				mana: new fields.SchemaField({
					...createPointsField(),
					mult: new fields.NumberField({
						required: true,
						initial: 5,
					}),
				}),
				personagem: new fields.SchemaField(createPointsField(10, null, { nullMax: true })),
				vida: new fields.SchemaField({
					...createPointsField(),
					mult: new fields.NumberField({
						required: true,
						initial: 5,
					}),
				}),
			}),
		};
	}
}
