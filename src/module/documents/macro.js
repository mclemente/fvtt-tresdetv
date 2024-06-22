import { getMacroTarget } from "../helpers/utils";

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} dropData     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createMacro(dropData, slot) {
	if (!dropData.uuid.includes("Actor.") && !dropData.uuid.includes("Token.")) {
		return ui.notifications.warn("You can only create macro buttons for owned Items");
	}
	const macroData = { type: "script", scope: "actor" };
	switch (dropData.type) {
		case "Item": {
			const itemData = await Item.implementation.fromDropData(dropData);
			foundry.utils.mergeObject(macroData, {
				name: itemData.name,
				img: itemData.img,
				command: `tresdetv.documents.macro.rollItem("${itemData.name}")`,
				flags: { "tresdetv.itemMacro": true },
			});
			break;
		}
		case "ActiveEffect": {
			const effectData = await ActiveEffect.implementation.fromDropData(dropData);
			foundry.utils.mergeObject(macroData, {
				name: effectData.label,
				img: effectData.icon,
				command: `tresdetv.documents.macro.toggleEffect("${effectData.label}")`,
				flags: { "tresdetv.effectMacro": true },
			});
			break;
		}
		default:
			return;
	}

	// Assign the macro to the hotbar
	const macro =
		game.macros.find((m) => {
			return m.name === macroData.name && m.command === macroData.command && m.isAuthor;
		}) || (await Macro.create(macroData));
	game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
export function rollItem(itemName) {
	return getMacroTarget(itemName, "Item")?.roll();
}

/**
 * Toggle an effect on and off when a macro is clicked.
 * @param {string} effectName        Name of the effect to be toggled.
 * @returns {Promise<ActiveEffect>}  The effect after it has been toggled.
 */
export function toggleEffect(effectName) {
	const effect = getMacroTarget(effectName, "ActiveEffect");
	return effect?.update({ disabled: !effect.disabled });
}
