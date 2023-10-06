const fields = foundry.data.fields;

export function createAttributeField(init = 0) {
	return {
		value: new fields.NumberField({
			required: true,
			initial: init,
			integer: true,
		}),
		max: new fields.NumberField({
			required: true,
			initial: null,
			integer: true,
			nullable: true,
		}),
		bonus: new fields.NumberField({
			required: true,
			initial: 0,
			integer: true,
		}),
		penalidade: new fields.NumberField({
			required: true,
			initial: 0,
			integer: true,
		}),
	};
}

export function createPointsField(init = 1, max = 1, options = { nullMax: false }) {
	return {
		value: new fields.NumberField({
			required: true,
			initial: init,
			integer: true,
		}),
		max: new fields.NumberField({
			required: true,
			initial: max,
			integer: true,
			nullable: options.nullMax,
		}),
	};
}

export function createDetails(type) {
	const data = {
		conceito: new fields.StringField({ initial: "" }),
		arquetipo: new fields.StringField({ initial: "" }),
	};
	if (type === "veiculo") {
		data.piloto = new fields.SchemaField({
			name: new fields.StringField({ initial: "" }),
			id: new fields.StringField({ initial: "" }),
		});
	}
	return { details: new fields.SchemaField(data) };
}
