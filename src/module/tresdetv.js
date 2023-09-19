// Import sheet classes.
import { ActorSheet3DeTV } from "./sheets/actor-sheet.js";
import { ItemSheet3DeTV } from "./sheets/item-sheet.js";
// Import helper/utility classes and constants.
import { TRESDETV } from "./helpers/config.js";
import { registerSettings } from "./helpers/settings.js";
import { preloadHandlebarsTemplates } from "./helpers/templates.js";
import CombatTrackerTresDeTV from "./siderbar/combatTracker.js";

import * as models from "./data/_module.js";
import * as dice from "./dice/_module.js";
import * as documents from "./documents/_module.js";
import * as utils from "./helpers/utils.js";
import * as hooks from "./hooks/_module.js";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.tresdetv = {
	config: TRESDETV,
	dice,
	documents,
};

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async () => {
	globalThis.tresdetv =
		globalThis.tresdet =
		game.tresdetv =
		game.tresdet =
			Object.assign(game.system, globalThis.tresdetv);

	// Add custom constants for configuration.
	CONFIG.tresdetv = CONFIG.tresdet = TRESDETV;
	CONFIG.Dice.RollTresDeTV = dice.RollTresDeTV;
	CONFIG.Dice.rolls.push(dice.RollTresDeTV);

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
		formula: "2d6 + @atributos.habilidade.value",
		decimals: 2,
	};

	// Define custom Document classes
	CONFIG.Actor.documentClass = documents.ActorTresDeTV;
	CONFIG.Item.documentClass = documents.ItemTresDeTV;
	CONFIG.Combat.documentClass = documents.CombatTresDeTV;
	// Patch Core Functions
	Combatant.prototype.getInitiativeRoll = utils.getInitiativeRoll;

	CONFIG.ui.combat = CombatTrackerTresDeTV;

	// Define DataModels
	CONFIG.Actor.dataModels.personagem = models.PersonagemData;
	CONFIG.Actor.dataModels.pdm = models.PdMData;
	CONFIG.Actor.dataModels.veiculo = models.VeiculoData;

	CONFIG.Item.dataModels.item = models.ItemData;
	CONFIG.Item.dataModels.pericia = models.PericiaData;
	CONFIG.Item.dataModels.tecnica = models.TenicaData;
	CONFIG.Item.dataModels.vantagem = models.VantagemData;
	CONFIG.Item.dataModels.desvantagem = models.DesvantagemData;

	const trackableAttributes = {
		bar: ["pontos.vida", "pontos.mana"],
		value: ["pontos.acao", "pontos.experiencia", "pontos.personagem"],
	};
	CONFIG.Actor.trackableAttributes = {
		personagem: trackableAttributes,
		pdm: trackableAttributes,
		veiculo: trackableAttributes,
	};

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("tresdetv", ActorSheet3DeTV, { label: "Ficha de Personagem 3DeTV", makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("tresdetv", ItemSheet3DeTV, { label: "Ficha de Item 3DeTV", makeDefault: true });

	// Register custom system settings
	registerSettings();

	for (let group of Object.keys(hooks)) {
		for (let hook of Object.getOwnPropertyNames(hooks[group])) {
			if (!["length", "name", "prototype"].includes(hook)) {
				Hooks.on(hook, hooks[group][hook]);
			}
		}
	}

	// Preload Handlebars templates.
	return preloadHandlebarsTemplates();
});

Hooks.once("i18nInit", () => utils.performPreLocalization(CONFIG.tresdetv));

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
});
