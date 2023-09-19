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
