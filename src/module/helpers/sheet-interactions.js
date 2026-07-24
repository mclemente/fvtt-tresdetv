/**
 * Registra interações compartilhadas entre as fichas do sistema.
 *
 * As fichas usam renderização manual com ApplicationV2. Por isso,
 * algumas interações que normalmente seriam ativadas pela classe base,
 * como o FilePicker ligado a uma imagem, são tratadas aqui.
 */
let listenersInstalled = false;

/**
 * Instala os listeners globais uma única vez.
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

/**
 * Distribui cliques para as interações especiais das fichas.
 *
 * @param {MouseEvent} event Evento de clique.
 * @returns {Promise<void>}
 * @private
 */
async function _onSheetClick(event) {
	const target = event.target;

	if (!(target instanceof Element)) {
		return;
	}

	const portraitButton = target.closest(".tresdetv .portrait-picker");

	if (portraitButton) {
		event.preventDefault();
		event.stopPropagation();

		try {
			await _openImagePicker(portraitButton);
		} catch (error) {
			console.error("3DeT Victory | Erro ao alterar imagem.", error);

			ui.notifications.error("Não foi possível alterar a imagem. Consulte o console.");
		}

		return;
	}

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

/**
 * Abre o FilePicker e salva a imagem no documento indicado pelo botão.
 *
 * @param {HTMLButtonElement} button Botão do retrato.
 * @returns {Promise<void>}
 * @private
 */
async function _openImagePicker(button) {
	const documentUuid = button.dataset.documentUuid;

	if (!documentUuid) {
		throw new Error("O botão do retrato não informou data-document-uuid.");
	}

	const document = await fromUuid(documentUuid);

	if (!document) {
		throw new Error(`Documento não encontrado: ${documentUuid}`);
	}

	if (!document.isOwner) {
		ui.notifications.warn("Você não tem permissão para alterar esta imagem.");

		return;
	}

	const target = button.dataset.target ?? "img";

	const FilePickerClass = foundry.applications.apps.FilePicker.implementation;

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

/**
 * Abre o diálogo de uma perícia e envia a rolagem ao chat.
 *
 * @param {HTMLButtonElement} button Botão da perícia.
 * @returns {Promise<Roll|undefined>}
 * @private
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

	const dice = Math.max(1, Math.min(3, requestedDice));

	const modifier = Number(result.modifier) || 0;

	const attributeValue = Number(attribute.value) || 0;

	const attributeShort = game.i18n.localize(`TRESDETV.Atributos.${attributeKey}.short`);

	const attributeLabel = game.i18n.localize(`TRESDETV.Atributos.${attributeKey}.label`);

	const rollData = actor.getRollData();

	/*
	 * Necessário para que o sistema aplique corretamente
	 * o atributo extra em resultados críticos.
	 */
	rollData.atr = attributeValue;

	let formula = `${dice}d6 + ${attributeValue}[${attributeShort}]`;

	if (modifier > 0) {
		formula += ` + ${modifier}[Modificador]`;
	} else if (modifier < 0) {
		formula += ` - ${Math.abs(modifier)}[Modificador]`;
	}

	const roll = new CONFIG.Dice.RollTresDeTV(formula, rollData, {
		flavor: `Teste de ${skillLabel} com ${attributeLabel}`,
	});

	return roll.toMessage({
		speaker: ChatMessage.getSpeaker({
			actor,
		}),
	});
}
