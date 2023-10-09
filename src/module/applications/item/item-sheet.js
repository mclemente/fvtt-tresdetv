import { onManageActiveEffect, prepareActiveEffectCategories } from "../../helpers/effects.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export default class ItemSheet3DeTV extends ItemSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["tresdetv", "sheet", "item"],
			width: 500,
			height: 485,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
		});
	}

	/** @override */
	get template() {
		const path = "systems/tresdetv/templates/item";
		if (!game.user.isGM && this.actor.limited) {
			return `${path}/limited-sheet.html`;
		}

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/${this.item.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		const itemData = context.item;

		// Retrieve the roll data for TinyMCE editors.
		context.rollData = {};
		let actor = this.object?.parent ?? null;
		if (actor) {
			context.rollData = actor.getRollData();
		}

		if (this.object.type === "tecnica") {
			context.atrChoices = CONFIG.TRESDETV.atributos;
		}

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = itemData.system;
		context.flags = itemData.flags;
		context.skills = CONFIG.tresdetv;

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.item.effects);

		context.isGM = game.user.isGM;

		return context;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Roll handlers, click handlers, etc. would go here.

		// Active Effect management
		html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.item));
	}
}
