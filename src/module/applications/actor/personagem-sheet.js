// import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.js";
import ActorSheetTresDeTV from "./base-sheet.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {FichaPersonagemTresDeTV}
 */
export default class FichaPersonagemTresDeTV extends ActorSheetTresDeTV {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["tresdetv", "sheet", "actor", "personagem"],
		});
	}
}
