const ITEM_ORIGIN_DEFINITIONS = Object.freeze({
	comprada: {
		label: "Compradas com pontos",
		icon: "fa-solid fa-star",
		order: 10,
	},

	arquetipo: {
		label: "Arquétipo",
		icon: "fa-solid fa-dna",
		order: 20,
	},

	kit: {
		label: "Kit de Arcanauta",
		icon: "fa-solid fa-shield-halved",
		order: 30,
	},

	artefato: {
		label: "Artefato",
		icon: "fa-solid fa-gem",
		order: 40,
	},

	tecnica: {
		label: "Técnica ou poder",
		icon: "fa-solid fa-bolt",
		order: 50,
	},

	temporaria: {
		label: "Temporária",
		icon: "fa-solid fa-hourglass-half",
		order: 60,
	},

	outra: {
		label: "Outras origens",
		icon: "fa-solid fa-layer-group",
		order: 70,
	},
});

/**
 * Registra os helpers Handlebars próprios do sistema.
 *
 * O método pode ser chamado mais de uma vez sem duplicar helpers.
 *
 * @returns {void}
 */
export function registerHandlebarsHelpers() {
	if (!Handlebars.helpers.groupByOrigin) {
		Handlebars.registerHelper("groupByOrigin", (items) => groupItemsByOrigin(items));
	}

	if (!Handlebars.helpers.selected) {
		Handlebars.registerHelper("selected", (current, expected) => {
			const currentValue = String(current ?? "");

			const expectedValue = String(expected ?? "");

			return currentValue === expectedValue ? "selected" : "";
		});
	}
}

/**
 * Agrupa Vantagens e Desvantagens conforme a origem configurada no Item.
 *
 * @param {Iterable<Item>|Item[]} items Itens que serão agrupados.
 * @returns {Array<object>} Grupos prontos para uso em Handlebars.
 */
export function groupItemsByOrigin(items = []) {
	const groups = new Map();

	for (const item of Array.from(items ?? [])) {
		const rawType = item?.system?.origem?.tipo ?? "comprada";

		const type = ITEM_ORIGIN_DEFINITIONS[rawType] ? rawType : "outra";

		const definition = ITEM_ORIGIN_DEFINITIONS[type];

		const detail = String(item?.system?.origem?.nome ?? "").trim();

		const normalizedDetail = detail.toLocaleLowerCase("pt-BR");

		const key = `${type}:${normalizedDetail}`;

		if (!groups.has(key)) {
			groups.set(key, {
				key,
				type,

				cssClass: `origin-${type}`,

				icon: definition.icon,

				order: definition.order,

				label: detail ? `${definition.label} — ${detail}` : definition.label,

				items: [],
			});
		}

		groups.get(key).items.push(item);
	}

	return Array.from(groups.values())
		.map((group) => {
			group.items.sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));

			group.count = group.items.length;

			return group;
		})
		.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "pt-BR"));
}

/**
 * Define os templates Handlebars que serão pré-carregados.
 *
 * @returns {Promise<object>}
 */
export const preloadHandlebarsTemplates = async function () {
	registerHandlebarsHelpers();

	const partials = [
		// Actor.
		"systems/tresdetv/templates/actor/parts/actor-points.hbs",
		"systems/tresdetv/templates/actor/parts/actor-features.hbs",
		"systems/tresdetv/templates/actor/parts/actor-header.hbs",
		"systems/tresdetv/templates/actor/parts/actor-items.hbs",
		"systems/tresdetv/templates/actor/parts/actor-skills.hbs",
		"systems/tresdetv/templates/actor/parts/actor-spells.hbs",
		"systems/tresdetv/templates/actor/parts/actor-effects.hbs",

		// Item.
		"systems/tresdetv/templates/item/parts/item-summary.hbs",

		// Aplicações.
		"systems/tresdetv/templates/apps/actor-tweaks.hbs",
		"systems/tresdetv/templates/apps/trait-selector.hbs",
		"systems/tresdetv/templates/apps/parts/trait-list.hbs",

		// Chat.
		"systems/tresdetv/templates/chat/item-card.hbs",
		"systems/tresdetv/templates/chat/roll-dialog.hbs",
	];

	const paths = {};

	for (const path of partials) {
		paths[path.replace(".hbs", ".html")] = path;

		const fileName = path.split("/").pop().replace(".hbs", "");

		paths[`tresdetv.${fileName}`] = path;
	}

	return foundry.applications.handlebars.loadTemplates(paths);
};

/* -------------------------------------------- */
/*  Object Helpers                              */
/* -------------------------------------------- */

/**
 * Ordena um objeto por seus valores ou por uma propriedade interna.
 *
 * @param {object} obj Objeto que será ordenado.
 * @param {string} [sortKey] Propriedade interna usada na ordenação.
 * @returns {object}
 */
export function sortObjectEntries(obj, sortKey) {
	let sorted = Object.entries(obj);

	if (sortKey) {
		sorted = sorted.sort((a, b) => a[1][sortKey].localeCompare(b[1][sortKey]));
	} else {
		sorted = sorted.sort((a, b) => a[1].localeCompare(b[1]));
	}

	return Object.fromEntries(sorted);
}

/* -------------------------------------------- */
/*  Config Pre-Localization                     */
/* -------------------------------------------- */

/**
 * Armazena as configurações que precisam de localização.
 *
 * @type {object}
 * @private
 */
const _preLocalizationRegistrations = {};

/**
 * Registra uma propriedade da configuração para localização.
 *
 * @param {string} configKeyPath Caminho em CONFIG.TRESDETV.
 * @param {object} options Opções.
 * @param {string} [options.key] Chave interna.
 * @param {string[]} [options.keys] Chaves internas.
 * @param {boolean} [options.sort] Ordena o resultado.
 * @returns {void}
 */
export function preLocalize(configKeyPath, { key, keys = [], sort = false } = {}) {
	if (key) {
		keys.unshift(key);
	}

	_preLocalizationRegistrations[configKeyPath] = {
		keys,
		sort,
	};
}

/**
 * Executa as tarefas de localização.
 *
 * @param {object} config Configuração do sistema.
 * @returns {void}
 */
export function performPreLocalization(config) {
	for (const [keyPath, settings] of Object.entries(_preLocalizationRegistrations)) {
		const target = foundry.utils.getProperty(config, keyPath);

		_localizeObject(target, settings.keys);

		if (settings.sort) {
			foundry.utils.setProperty(config, keyPath, sortObjectEntries(target, settings.keys[0]));
		}
	}
}

/**
 * Localiza os valores de um objeto.
 *
 * @param {object} obj Objeto.
 * @param {string[]} [keys] Chaves internas.
 * @returns {void}
 * @private
 */
function _localizeObject(obj, keys) {
	for (const [key, value] of Object.entries(obj)) {
		const type = typeof value;

		if (type === "string") {
			obj[key] = game.i18n.localize(value);

			continue;
		}

		if (type !== "object") {
			console.error(
				new Error(
					`Pre-localized configuration values must be a string or object, ${type} found for "${key}" instead.`,
				),
			);

			continue;
		}

		if (!keys?.length) {
			console.error(new Error("Localization keys must be provided for pre-localizing when target is an object."));

			continue;
		}

		for (const innerKey of keys) {
			if (!value[innerKey]) {
				continue;
			}

			value[innerKey] = game.i18n.localize(value[innerKey]);
		}
	}
}

/**
 * Encontra um documento em um Actor selecionado.
 *
 * @param {string} name Nome do documento.
 * @param {string} documentType Tipo do documento.
 * @returns {Document|Notification}
 */
export function getMacroTarget(name, documentType) {
	let actor;

	const speaker = ChatMessage.getSpeaker();

	if (speaker.token) {
		actor = game.actors.tokens[speaker.token];
	}

	actor ??= game.actors.get(speaker.actor);

	if (!actor) {
		return ui.notifications.warn(game.i18n.localize("MACRO.5eNoActorSelected"));
	}

	const collection = documentType === "Item" ? actor.items : actor.effects;

	const nameKeyPath = documentType === "Item" ? "name" : "label";

	const documents = collection.filter((item) => foundry.utils.getProperty(item, nameKeyPath) === name);

	const type = game.i18n.localize(`DOCUMENT.${documentType}`);

	if (documents.length === 0) {
		return ui.notifications.warn(
			`Your controlled actor '${actor.name}' does not have an ${type} with name '${name}'.`,
		);
	}

	if (documents.length > 1) {
		ui.notifications.warn(
			`Your controlled actor '${actor.name}' has more than one ${type} with name '${name}'. The first match will be chosen.`,
		);
	}

	return documents[0];
}

/**
 * Retorna a rolagem de iniciativa.
 *
 * @param {string} formula Fórmula alternativa.
 * @returns {Roll}
 */
export function getInitiativeRoll(formula) {
	if (!this.actor) {
		return new CONFIG.Dice.RollTresDeTV(formula ?? "2d6");
	}

	return this.actor.getInitiativeRoll({
		name: this.actor.isToken ? this.parent.name : this.name,
	});
}

/**
 * Prepara a lista de perícias configurada nas opções do sistema.
 *
 * @returns {void}
 */
export function getSkills() {
	const pericias = game.settings.get("tresdetv", "pericias").split(/[,;]/);

	CONFIG.TRESDETV.pericias = {};

	for (const pericia of pericias) {
		if (!pericia) {
			continue;
		}

		const key = pericia.trim().toLowerCase().replace(/[\s']/g, "_");

		const label = pericia.trim();

		CONFIG.TRESDETV.pericias[key] = label;
	}
}
