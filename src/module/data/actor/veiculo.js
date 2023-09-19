import { ActorData } from "./common.js";

export default class VeiculoData extends ActorData {
	static defineSchema() {
		const fields = foundry.data.fields;
		const superFields = super.defineSchema();
		superFields.detalhes.fields.piloto = new fields.SchemaField({
			name: new fields.StringField({ initial: "" }),
			id: new fields.StringField({ initial: "" }),
		});
		return superFields;
	}
}
