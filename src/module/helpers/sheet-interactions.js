/**
 * Interações compartilhadas entre as fichas
 * do sistema 3DeT Victory.
 *
 * Responsável por:
 *
 * - alteração de retratos;
 * - integração opcional com Tokenizer;
 * - atualização da imagem do Actor;
 * - atualização do Prototype Token;
 * - atualização de tokens existentes na cena;
 * - rolagem interativa de Perícias.
 */

const TOKENIZER_MODULE_ID = "vtta-tokenizer";

let listenersInstalled = false;

/**
 * Instala os listeners globais do sistema.
 *
 * O listener é instalado apenas uma vez.
 *
 * @returns {void}
 */
export function installSheetInteractions() {
	if (listenersInstalled) {
		return;
	}

	listenersInstalled = true;

	document.addEventListener("click", _onSheetClick);
}

/* -------------------------------------------- */
/*  Listener principal                          */
/* -------------------------------------------- */

/**
 * Distribui cliques das fichas.
 *
 * @param {MouseEvent} event Evento.
 * @returns {Promise<void>}
 * @private
 */
async function _onSheetClick(event) {
	const target = event.target;

	if (!(target instanceof Element)) {
		return;
	}

	/*
	 * Retrato do Actor ou Item.
	 */
	const portraitButton = target.closest(".tresdetv .portrait-picker");

	if (portraitButton) {
		event.preventDefault();
		event.stopPropagation();

		try {
			await _onPortraitClick(portraitButton, event);
		} catch (error) {
			console.error("3DeT Victory | Erro ao alterar imagem.", error);

			ui.notifications.error("Não foi possível alterar a imagem. Consulte o console.");
		}

		return;
	}

	/*
	 * Rolagem de Perícia.
	 */
	const skillButton = target.closest(".tresdetv .skill-roll-button");

	if (skillButton) {
		event.preventDefault();
		event.stopPropagation();

		try {
			await _rollSkill(skillButton);
		} catch (error) {
			console.error("3DeT Victory | Erro ao rolar perícia.", error);

			ui.notifications.error("Não foi possível realizar o teste de perícia. Consulte o console.");
		}
	}
}

/* ============================================ */
/*  RETRATO / TOKENIZER                         */
/* ============================================ */

/**
 * Trata o clique no retrato.
 *
 * Regras:
 *
 * Actor + Tokenizer:
 *     abre Tokenizer.
 *
 * Actor + Shift:
 *     abre FilePicker.
 *
 * Item:
 *     abre FilePicker.
 *
 * Tokenizer ausente:
 *     abre FilePicker.
 *
 * @param {HTMLElement} button Botão.
 * @param {MouseEvent} event Evento.
 * @returns {Promise<void>}
 */
async function _onPortraitClick(button, event) {
	const document = await _getPortraitDocument(button);

	if (!document) {
		throw new Error("Documento do retrato não encontrado.");
	}

	if (!document.isOwner) {
		ui.notifications.warn("Você não tem permissão para alterar esta imagem.");

		return;
	}

	/*
	 * Tokenizer só é usado para Actors.
	 *
	 * Shift força o seletor tradicional,
	 * seguindo o mesmo padrão usado pelo
	 * próprio Tokenizer.
	 */
	const useTokenizer = document.documentName === "Actor" && !event.shiftKey && isTokenizerAvailable();

	if (useTokenizer) {
		const opened = await _openTokenizer(document);

		if (opened) {
			return;
		}
	}

	/*
	 * Fallback:
	 *
	 * - Tokenizer ausente;
	 * - API indisponível;
	 * - Item;
	 * - Shift + clique.
	 */
	await _openImagePicker(button, document);
}

/**
 * Recupera o documento ligado ao retrato.
 *
 * @param {HTMLElement} button Botão.
 * @returns {Promise<Actor|Item|null>}
 */
async function _getPortraitDocument(button) {
	const uuid = button.dataset.documentUuid;

	if (!uuid) {
		return null;
	}

	return fromUuid(uuid);
}

/* -------------------------------------------- */
/*  Detecção do Tokenizer                       */
/* -------------------------------------------- */

/**
 * Informa se o Tokenizer está disponível.
 *
 * @returns {boolean}
 */
export function isTokenizerAvailable() {
	const module = game.modules.get(TOKENIZER_MODULE_ID);

	if (!module || !module.active) {
		return false;
	}

	const api = getTokenizerApi();

	return Boolean(api && typeof api.launch === "function");
}

/**
 * Obtém a API pública do Tokenizer.
 *
 * O módulo atualmente disponibiliza a API
 * em dois lugares:
 *
 * game.modules.get("vtta-tokenizer").api
 *
 * e
 *
 * window.Tokenizer
 *
 * @returns {object|null}
 */
function getTokenizerApi() {
	const module = game.modules.get(TOKENIZER_MODULE_ID);

	return module?.api ?? globalThis.Tokenizer ?? null;
}

/* -------------------------------------------- */
/*  Abrir Tokenizer                             */
/* -------------------------------------------- */

/**
 * Abre o Tokenizer para um Actor.
 *
 * Não utilizamos diretamente tokenizeActor()
 * porque os tipos do sistema 3DeT são:
 *
 * personagem
 * pdm
 * veiculo
 *
 * enquanto o Tokenizer identifica automaticamente
 * como PC apenas tipos "character" e "pc".
 *
 * @param {Actor} actor Actor.
 * @returns {Promise<boolean>}
 */
async function _openTokenizer(actor) {
	const api = getTokenizerApi();

	if (!api || typeof api.launch !== "function") {
		return false;
	}

	/*
	 * Personagem é PC.
	 *
	 * PDM e Veículo utilizam as configurações
	 * de NPC do Tokenizer.
	 */
	const tokenizerType = actor.type === "personagem" ? "pc" : "npc";

	const avatarFilename = _removeCacheQuery(actor.img);

	const tokenFilename = _removeCacheQuery(actor.prototypeToken?.texture?.src ?? actor.img);

	const options = {
		/*
		 * Actor é enviado também para que o
		 * Tokenizer possa usar seus dados
		 * internamente.
		 */
		actor,

		name: actor.name,

		type: tokenizerType,

		disposition: actor.prototypeToken?.disposition ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL,

		avatarFilename,

		tokenFilename,

		isWildCard: Boolean(actor.prototypeToken?.randomImg),

		/*
		 * Propriedade nossa.
		 *
		 * O Tokenizer devolve propriedades extras
		 * no callback, portanto isso também ajuda
		 * a identificar a origem da chamada.
		 */
		tresdetvActorUuid: actor.uuid,
	};

	try {
		api.launch(
			options,

			async (response) => {
				try {
					await _applyTokenizerResult(actor, response, api);
				} catch (error) {
					console.error("3DeT Victory | Tokenizer terminou, mas não foi possível atualizar o Actor.", error);

					ui.notifications.error("O Tokenizer criou as imagens, mas houve um erro ao atualizar a ficha.");
				}
			},
		);

		return true;
	} catch (error) {
		console.warn("3DeT Victory | Tokenizer não pôde ser aberto. Usando FilePicker.", error);

		ui.notifications.warn("Não foi possível abrir o Tokenizer. Abrindo o seletor normal de arquivos.");

		return false;
	}
}

/* -------------------------------------------- */
/*  Resultado do Tokenizer                      */
/* -------------------------------------------- */

/**
 * Aplica no Actor as imagens criadas
 * pelo Tokenizer.
 *
 * @param {Actor} actor Actor.
 * @param {object} response Resposta.
 * @param {object} tokenizerApi API.
 * @returns {Promise<void>}
 */
async function _applyTokenizerResult(actor, response, tokenizerApi) {
	if (!response) {
		return;
	}

	const avatarPath = response.avatarFilename ? _addCacheQuery(response.avatarFilename) : null;

	const tokenPath = response.tokenFilename ? _addCacheQuery(response.tokenFilename) : null;

	const update = {};

	/*
	 * Retrato mostrado na ficha.
	 */
	if (avatarPath) {
		update.img = avatarPath;
	}

	/*
	 * Token padrão do Actor.
	 */
	if (tokenPath && !response.isWildCard) {
		update["prototypeToken.texture.src"] = tokenPath;

		update["prototypeToken.randomImg"] = false;
	}

	if (Object.keys(update).length) {
		await actor.update(update);
	}

	/*
	 * Se a ficha pertence diretamente
	 * a um Token sintético, atualizamos
	 * também esse Token.
	 */
	if (tokenPath && actor.token) {
		try {
			await actor.token.update({
				"texture.src": tokenPath,
			});
		} catch (error) {
			console.warn("3DeT Victory | Não foi possível atualizar o token sintético diretamente.", error);
		}
	}

	/*
	 * O próprio Tokenizer disponibiliza
	 * esta função na API.
	 *
	 * Ela copia o Prototype Token atualizado
	 * para tokens ativos nas cenas.
	 */
	if (tokenPath && canvas.ready && typeof tokenizerApi.updateSceneTokenImg === "function") {
		try {
			await tokenizerApi.updateSceneTokenImg(actor);
		} catch (error) {
			console.warn(
				"3DeT Victory | Não foi possível atualizar automaticamente os tokens já colocados na cena.",
				error,
			);

			/*
			 * Temos um fallback próprio abaixo.
			 */
			await _updateActiveTokens(actor, tokenPath);
		}
	} else if (tokenPath && canvas.ready) {
		await _updateActiveTokens(actor, tokenPath);
	}

	/*
	 * Atualiza imediatamente as fichas
	 * abertas para mostrar o novo retrato.
	 */
	try {
		actor.sheet?.render?.({
			force: true,
		});
	} catch (error) {
		/*
		 * Não é um erro crítico.
		 *
		 * O documento atualizado já provocará
		 * renderização na maioria dos casos.
		 */
		console.debug("3DeT Victory | Renderização manual da ficha após Tokenizer não foi necessária.", error);
	}

	ui.notifications.info("Retrato e token atualizados pelo Tokenizer.");
}

/**
 * Fallback para atualizar tokens ativos
 * quando a função do Tokenizer não estiver
 * disponível.
 *
 * @param {Actor} actor Actor.
 * @param {string} tokenPath Imagem.
 * @returns {Promise<void>}
 */
async function _updateActiveTokens(actor, tokenPath) {
	if (!canvas.ready || !canvas.scene) {
		return;
	}

	const activeTokens = actor.getActiveTokens?.(true) ?? [];

	if (!activeTokens.length) {
		return;
	}

	const updates = activeTokens
		.map((token) => {
			const id = token.document?.id ?? token.id;

			if (!id) {
				return null;
			}

			return {
				_id: id,

				"texture.src": tokenPath,
			};
		})
		.filter(Boolean);

	if (!updates.length) {
		return;
	}

	await canvas.scene.updateEmbeddedDocuments("Token", updates);
}

/* -------------------------------------------- */
/*  FilePicker padrão                           */
/* -------------------------------------------- */

/**
 * Abre o FilePicker padrão do Foundry.
 *
 * Usado para:
 *
 * - Tokenizer ausente;
 * - Shift + clique;
 * - fichas de Item.
 *
 * @param {HTMLElement} button Botão.
 * @param {Actor|Item} document Documento.
 * @returns {Promise<void>}
 */
async function _openImagePicker(button, document) {
	const target = button.dataset.target ?? "img";

	const FilePickerClass = foundry.applications.apps.FilePicker.implementation;

	if (!FilePickerClass) {
		throw new Error("FilePicker do Foundry não encontrado.");
	}

	const picker = FilePickerClass.fromButton(button);

	picker.callback = async (path) => {
		const form = button.closest("form");

		const field = form?.elements?.namedItem(target);

		if (field) {
			field.value = path;
		}

		await document.update({
			[target]: path,
		});
	};

	await picker.render({
		force: true,
	});
}

/* -------------------------------------------- */
/*  Utilidades de caminho                       */
/* -------------------------------------------- */

/**
 * Remove querystring da imagem.
 *
 * Tokenizer usa "?timestamp" para evitar
 * cache de imagens.
 *
 * @param {string} path Caminho.
 * @returns {string}
 */
function _removeCacheQuery(path) {
	if (!path) {
		return "";
	}

	return String(path).split("?")[0];
}

/**
 * Adiciona timestamp para que o Foundry
 * não continue exibindo a imagem antiga
 * armazenada no cache.
 *
 * @param {string} path Caminho.
 * @returns {string}
 */
function _addCacheQuery(path) {
	if (!path) {
		return "";
	}

	const clean = _removeCacheQuery(path);

	return `${clean}?${Date.now()}`;
}

/* ============================================ */
/*  PERÍCIAS                                    */
/* ============================================ */

/**
 * Abre o diálogo de uma Perícia
 * e envia a rolagem ao Chat.
 *
 * @param {HTMLButtonElement} button Botão.
 * @returns {Promise<Roll|undefined>}
 */
async function _rollSkill(button) {
	const actorUuid = button.dataset.actorUuid;

	if (!actorUuid) {
		throw new Error("O botão da perícia não informou data-actor-uuid.");
	}

	const actor = await fromUuid(actorUuid);

	if (!actor) {
		throw new Error(`Actor não encontrado: ${actorUuid}`);
	}

	const skillLabel = button.dataset.skillLabel ?? button.textContent.trim() ?? "Perícia";

	const result = await foundry.applications.api.DialogV2.input({
		window: {
			title: `Teste de ${skillLabel}`,
		},

		content: `
					<div class="skill-roll-dialog">
						<div class="form-group">
							<label for="skill-roll-attribute">
								Atributo
							</label>

							<div class="form-fields">
								<select
									id="skill-roll-attribute"
									name="attribute"
								>
									<option value="poder">
										Poder
									</option>

									<option
										value="habilidade"
										selected
									>
										Habilidade
									</option>

									<option value="resistencia">
										Resistência
									</option>
								</select>
							</div>
						</div>

						<div class="form-group">
							<label for="skill-roll-dice">
								Quantidade de dados
							</label>

							<div class="form-fields">
								<input
									id="skill-roll-dice"
									name="dice"
									type="number"
									min="1"
									max="3"
									step="1"
									value="2"
									autofocus
								>
							</div>
						</div>

						<div class="form-group">
							<label for="skill-roll-modifier">
								Modificador
							</label>

							<div class="form-fields">
								<input
									id="skill-roll-modifier"
									name="modifier"
									type="number"
									step="1"
									value="0"
								>
							</div>
						</div>
					</div>
				`,

		modal: true,

		rejectClose: false,

		ok: {
			label: "Rolar",

			icon: "fa-solid fa-dice-d6",
		},
	});

	if (!result) {
		return;
	}

	const attributeKey = String(result.attribute ?? "habilidade");

	const attribute = actor.system?.atributos?.[attributeKey];

	if (!attribute) {
		ui.notifications.error(`3DeT Victory | Atributo desconhecido: ${attributeKey}`);

		return;
	}

	const requestedDice = Number(result.dice) || 2;

	const dice = Math.max(
		1,

		Math.min(3, requestedDice),
	);

	const modifier = Number(result.modifier) || 0;

	const attributeValue = Number(attribute.value) || 0;

	const attributeShort = game.i18n.localize(`TRESDETV.Atributos.${attributeKey}.short`);

	const attributeLabel = game.i18n.localize(`TRESDETV.Atributos.${attributeKey}.label`);

	const rollData = actor.getRollData();

	/*
	 * Necessário para os críticos
	 * do sistema.
	 */
	rollData.atr = attributeValue;

	let formula = `${dice}d6 + ${attributeValue}[${attributeShort}]`;

	if (modifier > 0) {
		formula += ` + ${modifier}[Modificador]`;
	} else if (modifier < 0) {
		formula += ` - ${Math.abs(modifier)}[Modificador]`;
	}

	const roll = new CONFIG.Dice.RollTresDeTV(
		formula,
		rollData,

		{
			flavor: `Teste de ${skillLabel} com ${attributeLabel}`,
		},
	);

	return roll.toMessage({
		speaker: ChatMessage.getSpeaker({
			actor,
		}),
	});
}
