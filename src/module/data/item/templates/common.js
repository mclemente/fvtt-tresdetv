const fields = foundry.data.fields;

export class BaseItemTemplate extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			descricao: new fields.HTMLField(),
		};
	}
}
