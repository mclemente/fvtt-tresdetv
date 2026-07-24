/**
 * Documento Actor personalizado do sistema 3DeT Victory.
 *
 * @extends {Actor}
 */
export default class ActorTresDeTV extends Actor {
	/**
	 * Define a imagem padrão para cada tipo de Actor.
	 *
	 * @param {object} actorData Dados iniciais do Actor.
	 * @returns {object}
	 */
	static getDefaultArtwork(actorData) {
		if (actorData.type === "personagem") {
			return super.getDefaultArtwork(actorData);
		}

		const images = {
			pdm: "orc-head",
			veiculo: "megabot",
		};

		const imageName = images[actorData.type];

		/*
		 * Evita gerar um caminho com "undefined"
		 * caso algum tipo desconhecido seja criado.
		 */
		if (!imageName) {
			return super.getDefaultArtwork(actorData);
		}

		const imagePath = `systems/tresdetv/assets/icons/svg/${imageName}.svg`;

		return {
			img: imagePath,

			texture: {
				src: imagePath,
			},
		};
	}

	/**
	 * Prepara os dados derivados do Actor.
	 *
	 * É importante chamar super.prepareDerivedData().
	 */
	prepareDerivedData() {
		super.prepareDerivedData();

		this._preparePointsData();
		this._prepareCharacterData();
		this._prepareNpcData();
	}

	/**
	 * Configura dados iniciais do Actor antes de sua criação.
	 *
	 * @param {object} data Dados iniciais.
	 * @param {object} options Opções de criação.
	 * @param {User} user Usuário responsável.
	 */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		const sourceId = this._stats.compendiumSource;

		/*
		 * Não altera atores importados diretamente
		 * de um compêndio.
		 */
		if (sourceId?.startsWith("Compendium.")) {
			return;
		}

		/*
		 * Configuração padrão do token de personagem.
		 *
		 * Como o Actor ainda não foi criado,
		 * updateSource deve ser utilizado.
		 */
		if (this.type === "personagem") {
			this.updateSource({
				prototypeToken: {
					actorLink: true,

					disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,

					sight: {
						enabled: true,
					},
				},
			});
		}
	}

	/**
	 * Calcula os valores máximos de PA, PV e PM.
	 *
	 * @returns {void}
	 */
	_preparePointsData() {
		const atributos = this.system?.atributos;

		const pontos = this.system?.pontos;

		if (!atributos || !pontos) {
			return;
		}

		const { poder, habilidade, resistencia } = atributos;

		const { acao, vida, mana } = pontos;

		if (!poder || !habilidade || !resistencia || !acao || !vida || !mana) {
			return;
		}

		const poderValue = Number(poder.value) || 0;

		const habilidadeValue = Number(habilidade.value) || 0;

		const resistenciaValue = Number(resistencia.value) || 0;

		const acaoMult = Number(acao.mult) || 0;

		const vidaMult = Number(vida.mult) || 0;

		const manaMult = Number(mana.mult) || 0;

		const acaoBonus = Number(acao.bonus) || 0;

		const vidaBonus = Number(vida.bonus) || 0;

		const manaBonus = Number(mana.bonus) || 0;

		acao.max = Math.max(poderValue * acaoMult, 1) + acaoBonus;

		vida.max = Math.max(resistenciaValue * vidaMult, 1) + vidaBonus;

		mana.max = Math.max(habilidadeValue * manaMult, 1) + manaBonus;
	}

	/**
	 * Prepara dados específicos de personagens.
	 *
	 * A lógica original de "character" pertencia
	 * ao sistema de exemplo e não correspondia
	 * ao tipo "personagem" deste sistema.
	 *
	 * @returns {void}
	 */
	_prepareCharacterData() {
		if (this.type !== "personagem") {
		}
	}

	/**
	 * Prepara dados específicos de PDMs.
	 *
	 * @returns {void}
	 */
	_prepareNpcData() {
		if (this.type !== "pdm") {
		}
	}

	/**
	 * Retorna os dados usados nas rolagens.
	 *
	 * @returns {object}
	 */
	getRollData() {
		const data = super.getRollData();

		const atributos = data.atributos ?? {};

		data.poder = atributos.poder?.value ?? 0;

		data.habilidade = atributos.habilidade?.value ?? 0;

		data.resistencia = atributos.resistencia?.value ?? 0;

		return data;
	}

	/* -------------------------------------------- */
	/*  Mecânicas de jogo                           */
	/* -------------------------------------------- */

	/**
	 * Modifica um atributo exibido na barra do Token.
	 *
	 * @param {string} attribute Caminho do atributo.
	 * @param {number} value Novo valor ou diferença.
	 * @param {boolean} isDelta Indica alteração relativa.
	 * @param {boolean} isBar Indica que é uma barra.
	 * @returns {Promise<Actor>}
	 */
	async modifyTokenAttribute(attribute, value, isDelta, isBar) {
		if (attribute === "pontos.vida") {
			const vida = this.system?.pontos?.vida;

			if (!vida) {
				return this;
			}

			const delta = isDelta ? -1 * value : vida.value - value;

			return this.applyDamage(delta);
		}

		return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
	}

	/**
	 * Aplica dano ou cura aos Pontos de Vida.
	 *
	 * Valores positivos causam dano.
	 * Valores negativos recuperam vida.
	 *
	 * @param {number} amount Quantidade.
	 * @param {number} multiplier Multiplicador.
	 * @returns {Promise<Actor>}
	 */
	async applyDamage(amount = 0, multiplier = 1) {
		const parsedAmount = Number.parseInt(amount, 10);

		const parsedMultiplier = Number(multiplier);

		const finalAmount = Math.floor(
			(Number.isNaN(parsedAmount) ? 0 : parsedAmount) * (Number.isNaN(parsedMultiplier) ? 1 : parsedMultiplier),
		);

		const vida = this.system?.pontos?.vida;

		if (!vida) {
			return this;
		}

		const currentValue = Number(vida.value) || 0;

		const maximumValue = Number(vida.max) || 0;

		const newValue = Math.clamp(currentValue - finalAmount, 0, Math.max(0, maximumValue));

		const updates = {
			"system.pontos.vida.value": newValue,
		};

		const allowed = Hooks.call(
			"modifyTokenAttribute",
			{
				attribute: "pontos.vida",

				value: finalAmount,
				isDelta: false,
				isBar: true,
			},
			updates,
		);

		if (allowed === false) {
			return this;
		}

		return this.update(updates, {
			dhp: -finalAmount,
		});
	}

	/**
	 * Executado depois que o Actor é atualizado.
	 *
	 * @param {object} changed Dados alterados.
	 * @param {object} options Opções da alteração.
	 * @param {string} userId ID do usuário.
	 */
	_onUpdate(changed, options, userId) {
		super._onUpdate(changed, options, userId);

		this._displayScrollingDamage(options.dhp);
	}

	/**
	 * Exibe o texto flutuante de dano ou cura.
	 *
	 * @param {number} dhp Alteração dos PV.
	 * @returns {void}
	 */
	_displayScrollingDamage(dhp) {
		if (!dhp) {
			return;
		}

		const value = Number(dhp);

		const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);

		for (const token of tokens) {
			if (!token || !token.visible || !token.renderable) {
				continue;
			}

			const maximumLife = Number(this.system?.pontos?.vida?.max) || 1;

			const percentage = Math.clamp(Math.abs(value) / maximumLife, 0, 1);

			canvas.interface.createScrollingText(token.center, value.signedString(), {
				anchor: CONST.TEXT_ANCHOR_POINTS.TOP,

				fontSize: 16 + 32 * percentage,

				fill: CONFIG.TRESDETV.tokenHPColors[value < 0 ? "damage" : "healing"],

				stroke: 0x000000,
				strokeThickness: 4,
				jitter: 0.25,
			});
		}
	}

	/* -------------------------------------------- */
	/*  Rolagens                                    */
	/* -------------------------------------------- */

	/**
	 * Executa um teste de atributo.
	 *
	 * @param {string} key Chave do atributo.
	 * @param {Event} event Evento original.
	 * @param {object} options Opções da rolagem.
	 * @returns {Promise<Roll | undefined>}
	 */
	async rollTest(
		key,
		event,
		{
			title,
			dice = false,
			configure = true,
			bonus = 0,
			maestria = 6,
			semCrit = false,
			target = 0,
			targetMessage,
		} = {},
	) {
		const attribute = this.system?.atributos?.[key];

		if (!attribute) {
			ui.notifications.error(`3DeT Victory | Atributo desconhecido: ${key}`);

			return;
		}

		const label = game.i18n.localize(`TRESDETV.Atributos.${key}.label`);

		const rollData = this.getRollData();

		let formula = dice ? `${dice}d6` : "2d6";

		const attributeValue = Number(attribute.value) || 0;

		const short = game.i18n.localize(`TRESDETV.Atributos.${key}.short`);

		rollData.atr = attributeValue;

		formula += ` + ${attributeValue}[${short}]`;

		const roll = new CONFIG.Dice.RollTresDeTV(formula, rollData, {
			flavor: `Teste de ${label}`,
		});

		if (configure) {
			const choice = await roll.configureDialog({
				title: title ?? `Teste de ${label}: ${this.name}`,

				actor: this,
				data: rollData,
				event,
				rollDice: dice,
				bonus,
				maestria,
				semCrit,
				target,
			});

			if (choice === null) {
				return;
			}
		}

		const messageData = {
			flags: {},

			speaker: ChatMessage.getSpeaker({
				actor: this,
			}),
		};

		if (roll.critRange) {
			messageData.flags.tresdetv = {
				...messageData.flags.tresdetv,

				critRange: roll.critRange,
			};
		}

		if (targetMessage) {
			messageData.flags.tresdetv = {
				...messageData.flags.tresdetv,

				targetMessage,
			};
		}

		return roll.toMessage(messageData);
	}

	/**
	 * Prepara a rolagem de iniciativa.
	 *
	 * @param {object} options Opções da rolagem.
	 * @returns {Promise<Roll | undefined>}
	 */
	async getInitiativeRoll(options = {}) {
		if (this._cachedInitiativeRoll) {
			return this._cachedInitiativeRoll.clone();
		}

		const rollData = this.getRollData();

		const habilidade = this.system?.atributos?.habilidade;

		if (!habilidade) {
			ui.notifications.error("3DeT Victory | O Actor não possui o atributo Habilidade.");

			return;
		}

		let formula = "2d6";

		const attributeValue = Number(habilidade.value) || 0;

		rollData.atr = attributeValue;

		const short = game.i18n.localize("TRESDETV.Atributos.habilidade.short");

		formula += ` + ${attributeValue}[${short}]`;

		const tiebreaker = game.settings.get("tresdetv", "initiativeTiebreaker");

		if (tiebreaker) {
			formula += ` + ${Math.trunc(Math.random() * 100) / 100}`;
		}

		const rollOptions = {
			...options,

			flavor: options.flavor ?? game.i18n.localize("TRESDETV.Initiative"),
		};

		const roll = new CONFIG.Dice.RollTresDeTV(formula, rollData, rollOptions);

		const choice = await roll.configureDialog({
			title: "Teste de Iniciativa",

			actor: this,
			data: rollData,
			isInitiative: true,
		});

		if (choice === null) {
			return;
		}

		return roll;
	}

	/**
	 * Executa a rolagem de iniciativa com diálogo.
	 *
	 * @param {object} rollOptions Opções da rolagem.
	 * @returns {Promise<void>}
	 */
	async rollInitiativeDialog(rollOptions = {}) {
		const roll = await this.getInitiativeRoll({
			...rollOptions,

			name: this.isToken ? this.parent?.name : this.name,
		});

		if (!roll) {
			return;
		}

		this._cachedInitiativeRoll = roll;

		try {
			await this.rollInitiative({
				createCombatants: true,
			});
		} finally {
			delete this._cachedInitiativeRoll;
		}
	}
}
