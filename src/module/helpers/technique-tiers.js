/**
 * Definições visuais das categorias de Técnica.
 */
export const TECHNIQUE_TIER_DEFINITIONS = Object.freeze({
	truque: {
		label: "Truques",
		singular: "Truque",

		icon: "fa-solid fa-book-open",

		order: 10,
	},

	comum: {
		label: "Técnicas Comuns",
		singular: "Técnica Comum",

		icon: "fa-solid fa-bolt",

		order: 20,
	},

	lendaria: {
		label: "Técnicas Lendárias",

		singular: "Técnica Lendária",

		icon: "fa-solid fa-crown",

		order: 30,
	},
});

/**
 * Registra os helpers Handlebars usados
 * pela área de Técnicas.
 *
 * @returns {void}
 */
export function registerTechniqueTierHelpers() {
	if (Handlebars.helpers.groupTechniquesByTier) {
		return;
	}

	Handlebars.registerHelper(
		"groupTechniquesByTier",

		(items) => groupTechniquesByTier(items),
	);
}

/**
 * Agrupa as Técnicas do Actor por categoria.
 *
 * As três categorias são sempre retornadas,
 * mesmo quando estiverem vazias.
 *
 * Técnicas antigas sem system.categoria
 * são tratadas como Técnicas Comuns.
 *
 * @param {Iterable<Item>|Item[]} items Técnicas do Actor.
 * @returns {Array<object>}
 */
export function groupTechniquesByTier(items = []) {
	const groups = new Map(
		Object.entries(TECHNIQUE_TIER_DEFINITIONS).map(([tier, definition]) => [
			tier,

			{
				key: tier,

				label: definition.label,

				singular: definition.singular,

				icon: definition.icon,

				order: definition.order,

				cssClass: `technique-tier-${tier}`,

				items: [],
			},
		]),
	);

	for (const item of Array.from(items ?? [])) {
		const rawTier = String(item?.system?.categoria ?? "comum");

		const tier = TECHNIQUE_TIER_DEFINITIONS[rawTier] ? rawTier : "comum";

		groups.get(tier).items.push(item);
	}

	return Array.from(groups.values())
		.map((group) => {
			group.items.sort((a, b) =>
				String(a.name).localeCompare(
					String(b.name),

					"pt-BR",
				),
			);

			group.count = group.items.length;

			return group;
		})
		.sort((a, b) => a.order - b.order);
}
