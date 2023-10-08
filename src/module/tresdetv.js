// Import helper/utility classes and constants.
import TRESDETV from "./helpers/config.js";
import registerSettings from "./helpers/settings.js";

import * as applications from "./applications/_module.js";
import * as dataModels from "./data/_module.js";
import * as dice from "./dice/_module.js";
import * as documents from "./documents/_module.js";
import * as utils from "./helpers/utils.js";
import * as hooks from "./hooks/_module.js";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.tresdetv = {
	applications,
	config: TRESDETV,
	dataModels,
	dice,
	documents,
	utils,
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
	CONFIG.TRESDETV = CONFIG.tresdetv = CONFIG.tresdet = TRESDETV;
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

	CONFIG.ui.combat = applications.combat.CombatTrackerTresDeTV;

	// Define DataModels
	CONFIG.Actor.dataModels.personagem = dataModels.ActorData;
	CONFIG.Actor.dataModels.pdm = dataModels.ActorData;
	CONFIG.Actor.dataModels.veiculo = dataModels.VeiculoData;

	CONFIG.Item.dataModels.item = dataModels.ItemData;
	// CONFIG.Item.dataModels.pericia = dataModels.PericiaData;
	CONFIG.Item.dataModels.tecnica = dataModels.TenicaData;
	CONFIG.Item.dataModels.vantagem = dataModels.VantagemData;
	CONFIG.Item.dataModels.desvantagem = dataModels.DesvantagemData;

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
	Actors.registerSheet("tresdetv", applications.actor.ActorSheet3DeTV, {
		label: "Ficha de Personagem 3DeTV",
		makeDefault: true,
	});
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("tresdetv", applications.item.ItemSheet3DeTV, {
		label: "Ficha de Item 3DeTV",
		makeDefault: true,
	});

	// Register custom system settings
	registerSettings();
	utils.getSkills();

	for (let group of Object.keys(hooks)) {
		for (let hook of Object.getOwnPropertyNames(hooks[group])) {
			if (!["length", "name", "prototype"].includes(hook)) {
				Hooks.on(hook, hooks[group][hook]);
			}
		}
	}

	// Preload Handlebars templates.
	utils.preloadHandlebarsTemplates();
});

Hooks.once("i18nInit", () => utils.performPreLocalization(CONFIG.tresdetv));

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
	// Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
});
