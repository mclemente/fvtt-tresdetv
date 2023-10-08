import { createAttributeField, createDetails, createPointsField } from "../shared";

const fields = foundry.data.fields;

export class ActorData extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			atributos: new fields.SchemaField({
				poder: new fields.SchemaField(createAttributeField()),
				habilidade: new fields.SchemaField(createAttributeField()),
				resistencia: new fields.SchemaField(createAttributeField()),
			}),
			darma: new fields.BooleanField(),
			pericias: new fields.SchemaField(
				{
					value: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
						label: "Escolhidas",
						initial: [],
					}),
					custom: new foundry.data.fields.StringField({ required: true, label: "Special" }),
				},
				{ label: "Perícias" },
			),
			pontos: new fields.SchemaField({
				acao: new fields.SchemaField({
					...createPointsField(),
					mult: new fields.NumberField({
						required: true,
						initial: 1,
					}),
				}),
				experiencia: new fields.SchemaField(createPointsField(0, null, { nullMax: true })),
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
			...createDetails(this.type),
		};
	}
}
