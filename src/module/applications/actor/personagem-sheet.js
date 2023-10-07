// import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.js";
import ActorSheet3DeTV from "./base-sheet.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FichaPersonagem3DeTV}
 */
export default class FichaPersonagem3DeTV extends ActorSheet3DeTV {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["tresdetv", "sheet", "actor", "personagem"],
		});
	}
}
