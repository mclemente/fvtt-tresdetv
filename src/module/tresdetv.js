// Import helper/utility classes and constants.
import TRESDETV from "./helpers/config.js";

import registerSettings from "./helpers/settings.js";

import { setTextEnrichers } from "./helpers/text-editor-enrichers.js";

import { installSheetInteractions } from "./helpers/sheet-interactions.js";

import { registerTechniqueTierHelpers } from "./helpers/technique-tiers.js";

import { installPdfExportControls } from "./helpers/pdf-export-controls.js";

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

Hooks.once(
	"init",

	async () => {
		globalThis.tresdetv =
			globalThis.tresdet =
			game.tresdetv =
			game.tresdet =
				Object.assign(game.system, globalThis.tresdetv);

		CONFIG.TRESDETV = CONFIG.tresdetv = CONFIG.tresdet = TRESDETV;

		CONFIG.Dice.RollTresDeTV = dice.RollTresDeTV;

		CONFIG.Dice.rolls.push(dice.RollTresDeTV);

		CONFIG.Combat.initiative = {
			formula: "2d6 + @atributos.habilidade.value",

			decimals: 2,
		};

		/*
		 * Classes personalizadas
		 * de documentos.
		 */
		CONFIG.Actor.documentClass = documents.ActorTresDeTV;

		CONFIG.Item.documentClass = documents.ItemTresDeTV;

		CONFIG.Combat.documentClass = documents.CombatTresDeTV;

		Combatant.prototype.getInitiativeRoll = utils.getInitiativeRoll;

		/*
		 * Interfaces personalizadas.
		 */
		CONFIG.ui.chat = applications.sidebar.ChatLogTresDeTV;

		CONFIG.ui.combat = applications.sidebar.CombatTrackerTresDeTV;

		/*
		 * Data Models dos Actors.
		 */
		CONFIG.Actor.dataModels.personagem = dataModels.ActorData;

		CONFIG.Actor.dataModels.pdm = dataModels.ActorData;

		CONFIG.Actor.dataModels.veiculo = dataModels.VeiculoData;

		/*
		 * Data Models dos Items.
		 */
		CONFIG.Item.dataModels.item = dataModels.ItemData;

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

		/*
		 * Efeito de Karma.
		 */
		CONFIG.statusEffects = [
			...CONFIG.statusEffects.slice(0, 1),

			{
				img: "systems/tresdetv/assets/icons/svg/cycle.svg",

				id: "karma",
				name: "Karma",

				description: "<i>O que vai, volta.</i>",

				enumerable: false,
				configurable: true,
			},

			...CONFIG.statusEffects.slice(1),
		];

		/*
		 * Registro das fichas.
		 */
		const ActorSheetClass = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;

		const ItemSheetClass = foundry.appv1?.sheets?.ItemSheet ?? ItemSheet;

		foundry.documents.collections.Actors.unregisterSheet("core", ActorSheetClass);

		foundry.documents.collections.Actors.registerSheet(
			"tresdetv",

			applications.actor.ActorSheetTresDeTV,

			{
				label: "Ficha de Personagem 3DeTV",

				makeDefault: true,
			},
		);

		foundry.documents.collections.Items.unregisterSheet("core", ItemSheetClass);

		foundry.documents.collections.Items.registerSheet(
			"tresdetv",

			applications.item.ItemSheetTresDeTV,

			{
				label: "Ficha de Item 3DeTV",

				makeDefault: true,
			},
		);

		registerSettings();
		utils.getSkills();
		setTextEnrichers();

		/*
		 * Adiciona Exportar para PDF ao menu
		 * de todas as fichas de Actor e Item.
		 */
		installPdfExportControls();

		for (const group of Object.keys(hooks)) {
			for (const hook of Object.getOwnPropertyNames(hooks[group])) {
				if (["length", "name", "prototype"].includes(hook)) {
					continue;
				}

				Hooks.on(hook, hooks[group][hook]);
			}
		}

		/*
		 * Helpers de Truques, Técnicas Comuns
		 * e Técnicas Lendárias.
		 */
		registerTechniqueTierHelpers();

		/*
		 * Templates Handlebars.
		 */
		utils.preloadHandlebarsTemplates();
	},
);

Hooks.once(
	"i18nInit",

	() => utils.performPreLocalization(CONFIG.tresdetv),
);

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once(
	"ready",

	async () => {
		installSheetInteractions();
	},
);
