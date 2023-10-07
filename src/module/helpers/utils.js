/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	return loadTemplates([
		// Actor partials.
		"systems/tresdetv/templates/actor/parts/actor-points.html",
		"systems/tresdetv/templates/actor/parts/actor-features.html",
		"systems/tresdetv/templates/actor/parts/actor-items.html",
		"systems/tresdetv/templates/actor/parts/actor-skills.html",
		"systems/tresdetv/templates/actor/parts/actor-spells.html",
		"systems/tresdetv/templates/actor/parts/actor-effects.html",
		// Roll Dialog
		"systems/tresdetv/templates/apps/dialog.hbs",
		"systems/tresdetv/templates/apps/roll-dialog.hbs",
	]);
};

/* -------------------------------------------- */
/*  Object Helpers                              */
/* -------------------------------------------- */

/**
 * Sort the provided object by its values or by an inner sortKey.
 * @param {object} obj        The object to sort.
 * @param {string} [sortKey]  An inner key upon which to sort.
 * @returns {object}          A copy of the original object that has been sorted.
 */
export function sortObjectEntries(obj, sortKey) {
	let sorted = Object.entries(obj);
	if (sortKey) sorted = sorted.sort((a, b) => a[1][sortKey].localeCompare(b[1][sortKey]));
	else sorted = sorted.sort((a, b) => a[1].localeCompare(b[1]));
	return Object.fromEntries(sorted);
}

/* -------------------------------------------- */
/*  Config Pre-Localization                     */
/* -------------------------------------------- */

/**
 * Storage for pre-localization configuration.
 * @type {object}
 * @private
 */
const _preLocalizationRegistrations = {};

/**
 * Mark the provided config key to be pre-localized during the init stage.
 * @param {string} configKeyPath          Key path within `CONFIG.DND5E` to localize.
 * @param {object} [options={}]
 * @param {string} [options.key]          If each entry in the config enum is an object,
 *                                        localize and sort using this property.
 * @param {string[]} [options.keys=[]]    Array of localization keys. First key listed will be used for sorting
 *                                        if multiple are provided.
 * @param {boolean} [options.sort=false]  Sort this config enum, using the key if set.
 */
export function preLocalize(configKeyPath, { key, keys = [], sort = false } = {}) {
	if (key) keys.unshift(key);
	_preLocalizationRegistrations[configKeyPath] = { keys, sort };
}

/* -------------------------------------------- */

/**
 * Execute previously defined pre-localization tasks on the provided config object.
 * @param {object} config  The `CONFIG.DND5E` object to localize and sort. *Will be mutated.*
 */
export function performPreLocalization(config) {
	for (const [keyPath, settings] of Object.entries(_preLocalizationRegistrations)) {
		const target = foundry.utils.getProperty(config, keyPath);
		_localizeObject(target, settings.keys);
		if (settings.sort) foundry.utils.setProperty(config, keyPath, sortObjectEntries(target, settings.keys[0]));
	}
}

/* -------------------------------------------- */

/**
 * Localize the values of a configuration object by translating them in-place.
 * @param {object} obj       The configuration object to localize.
 * @param {string[]} [keys]  List of inner keys that should be localized if this is an object.
 * @private
 */
function _localizeObject(obj, keys) {
	for (const [k, v] of Object.entries(obj)) {
		const type = typeof v;
		if (type === "string") {
			obj[k] = game.i18n.localize(v);
			continue;
		}

		if (type !== "object") {
			console.error(
				new Error(
					`Pre-localized configuration values must be a string or object, ${type} found for "${k}" instead.`,
				),
			);
			continue;
		}
		if (!keys?.length) {
			console.error(new Error("Localization keys must be provided for pre-localizing when target is an object."));
			continue;
		}

		for (const key of keys) {
			if (!v[key]) continue;
			v[key] = game.i18n.localize(v[key]);
		}
	}
}

/**
 * Find a document of the specified name and type on an assigned or selected actor.
 * @param {string} name          Document name to locate.
 * @param {string} documentType  Type of embedded document (e.g. "Item" or "ActiveEffect").
 * @returns {Document}           Document if found, otherwise nothing.
 */
export function getMacroTarget(name, documentType) {
	let actor;
	const speaker = ChatMessage.getSpeaker();
	if (speaker.token) actor = game.actors.tokens[speaker.token];
	actor ??= game.actors.get(speaker.actor);
	if (!actor) return ui.notifications.warn(game.i18n.localize("MACRO.5eNoActorSelected"));

	const collection = documentType === "Item" ? actor.items : actor.effects;
	const nameKeyPath = documentType === "Item" ? "name" : "label";

	// Find item in collection
	const documents = collection.filter((i) => foundry.utils.getProperty(i, nameKeyPath) === name);
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

export function getInitiativeRoll(formula) {
	if (!this.actor) return new CONFIG.Dice.RollTresDeTV(formula ?? "2d6 + 0");
	return this.actor.getInitiativeRoll();
}
