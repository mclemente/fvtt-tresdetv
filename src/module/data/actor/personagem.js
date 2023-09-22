import { createPointsField } from "../shared.js";
import { ActorData } from "./common.js";

export default class PersonagemData extends ActorData {
	static defineSchema() {
		const fields = foundry.data.fields;
		const superFields = super.defineSchema();
		superFields.pontos.fields.experiencia = new fields.SchemaField(createPointsField(0, null, { nullMax: true }));
		return {
			...superFields,
			detalhes: new fields.SchemaField({
				conceito: new fields.StringField({ initial: "" }),
				arquetipo: new fields.StringField({ initial: "" }),
			}),
		};
	}
}
