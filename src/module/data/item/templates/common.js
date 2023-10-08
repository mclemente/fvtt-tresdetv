const fields = foundry.data.fields;

export class BaseItemData extends foundry.abstract.DataModel {
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

export function createObjeto() {
	return {
		objeto: new fields.SchemaField({
			custo: new fields.NumberField({ initial: 0 }),
			quantidade: new fields.NumberField({ initial: 1 }),
		}),
	};
}
