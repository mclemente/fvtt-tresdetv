/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export default class ActorTresDeTV extends Actor {
	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		// Data modifications in this step occur before processing embedded
		// documents or derived data.
	}

	/**
	 * @override
	 * Augment the basic actor data with additional dynamic data. Typically,
	 * you'll want to handle most of your calculated/derived data in this step.
	 * Data calculated in this step should generally not exist in template.json
	 * (such as ability modifiers rather than ability scores) and should be
	 * available both inside and outside of character sheets (such as if an actor
	 * is queried and has a roll executed directly from it).
	 */
	prepareDerivedData() {
		this._preparePointsData();
		this._prepareCharacterData();
		this._prepareNpcData();
	}

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Configure prototype token settings
		const changes = {};
		const prototypeToken = {};
		if (this.type === "personagem") {
			Object.assign(prototypeToken, {
				sight: { enabled: true },
				actorLink: true,
				disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
			});
			changes.prototypeToken = prototypeToken;
		} else if (this.type === "pdm") {
			const img = "systems/tresdetv/assets/icons/svg/orc-head.svg";
			Object.assign(prototypeToken, {
				texture: { src: img },
			});
			changes.prototypeToken = prototypeToken;
			changes.img = img;
		} else if (this.type === "veiculo") {
			const img = "systems/tresdetv/assets/icons/svg/megabot.svg";
			Object.assign(prototypeToken, {
				texture: { src: img },
			});
			changes.prototypeToken = prototypeToken;
			changes.img = img;
		}
		this.updateSource(changes);
	}

	_preparePointsData() {
		const { poder, habilidade, resistencia } = this.system.atributos;
		const { acao, vida, mana } = this.system.pontos;
		acao.max = Math.max(poder.value * acao.mult, 1);
		vida.max = Math.max(resistencia.value * vida.mult, 1);
		mana.max = Math.max(habilidade.value * mana.mult, 1);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData() {
		if (this.type !== "character") return;
		const attack = this.system.attributes.attack;
		if (!attack) return;
		if (this.system.characteristics.str.value >= 15) {
			attack.value += 1;
		}
	}

	/**
	 * Prepare NPC type specific data.
	 */
	_prepareNpcData() {
		// if (this.type !== "npc") return;
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		const data = super.getRollData();

		data.poder = data.atributos.poder.value;
		data.habilidade = data.atributos.habilidade.value;
		data.resistencia = data.atributos.resistencia.value;

		// Prepare character roll data.
		// this._getCharacterRollData(data);
		// this._getNpcRollData(data);

		return data;
	}

	/**
	 * Prepare character roll data.
	 */
	// eslint-disable-next-line no-unused-vars
	_getCharacterRollData(data) {
		// if (this.type !== "personagem") return;
	}

	/**
	 * Prepare NPC roll data.
	 */
	// eslint-disable-next-line no-unused-vars
	_getNpcRollData(data) {
		// if (this.type !== "npc") return;
	}

	async rollTest(key, event, { dice = false, configure = true, bonus = 0, maestria = 6 }) {
		const short = game.i18n.localize(`TRESDETV.Atributos.${key}.short`);
		const label = game.i18n.localize(`TRESDETV.Atributos.${key}.label`);
		const data = this.getRollData();
		let formula = dice ? `${dice}d6` : "2d6";
		const atr = this.system.atributos[key].value;
		if (atr) {
			data.atr = atr;
			formula += `+ ${atr}[${short}]`;
		}
		const roll = new CONFIG.Dice.RollTresDeTV(formula, data);
		if (configure) {
			const choice = await roll.configureDialog({
				title: `Teste de ${label}`,
				actor: this,
				data,
				event,
				rollDice: dice,
				bonus,
				maestria: maestria,
			});
			if (choice === null) return;
		}
		const messageData = {
			flags: {},
		};
		if (roll.critRange) messageData.flags.tresdetv = { critRange: roll.critRange };
		return roll.toMessage(messageData);
	}

	/* -------------------------------------------- */

	/**
	 * Get an un-evaluated D20Roll instance used to roll initiative for this Actor.
	 * @param {object} [options]                        Options which modify the roll
	 * @param {D20Roll.ADV_MODE} [options.advantageMode]    A specific advantage mode to apply
	 * @param {string} [options.flavor]                     Special flavor text to apply
	 * @returns {D20Roll}                               The constructed but unevaluated D20Roll
	 */
	getInitiativeRoll(options = {}) {
		// Use a temporarily cached initiative roll
		if (this._cachedInitiativeRoll) return this._cachedInitiativeRoll.clone();

		// Obtain required data
		const data = this.getRollData();

		// Standard initiative formula
		const parts = ["2d6", "@atr"];
		data.atr = this.system.atributos.habilidade.value;

		// Tiebreaker
		const tiebreaker = game.settings.get("tresdetv", "initiativeTiebreaker");
		if (tiebreaker) {
			parts.push(String(Math.trunc(Math.random() * 100) / 100));
		}

		options = foundry.utils.mergeObject(
			{
				flavor: options.flavor ?? game.i18n.localize("TRESDETV.Initiative"),
			},
			options,
		);

		// Create the d20 roll
		const formula = parts.join(" + ");
		return new CONFIG.Dice.RollTresDeTV(formula, data, options);
	}

	/* -------------------------------------------- */

	/**
	 * Roll initiative for this Actor with a dialog that provides an opportunity to elect advantage or other bonuses.
	 * @param {object} [rollOptions]      Options forwarded to the Actor#getInitiativeRoll method
	 * @returns {Promise<void>}           A promise which resolves once initiative has been rolled for the Actor
	 */
	async rollInitiativeDialog(rollOptions = {}) {
		// Create and configure the Initiative roll
		const roll = this.getInitiativeRoll(rollOptions);
		const choice = await roll.configureDialog({
			title: `Rolagem de Iniciativa: ${this.name}`,
		});
		if (choice === null) return; // Closed dialog

		// Temporarily cache the configured roll and use it to roll initiative for the Actor
		this._cachedInitiativeRoll = roll;
		await this.rollInitiative({ createCombatants: true });
		delete this._cachedInitiativeRoll;
	}
}
