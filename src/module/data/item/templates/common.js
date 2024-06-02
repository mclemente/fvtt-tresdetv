const fields = foundry.data.fields;

export class BaseItemTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			descricao: new fields.HTMLField(),
		};
	}
}

export function createConcessao() {
	return {
		concessao: new fields.ArrayField(
			new fields.SchemaField({
				id: new fields.StringField({ initial: "" }),
				type: new fields.StringField({ initial: "" }),
			}),
		),
	};
}
