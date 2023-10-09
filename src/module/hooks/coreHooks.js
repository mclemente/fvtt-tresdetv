import { createMacro } from "../documents/macro";

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unreachable */
export default class CoreHooks {
	static hotbarDrop(bar, data, slot) {
		if (["ActiveEffect", "Item"].includes(data.type)) {
			createMacro(data, slot);
			return false;
		}
	}

	static renderChatMessage(message, html, data) {
		if (message.isRoll) {
			const critRange = message.getFlag("tresdetv", "critRange");
			if (critRange) {
				const diceRolls = html.find(".dice-rolls")[0].children;
				for (let dieRoll of diceRolls) {
					if (dieRoll.classList.contains("max")) continue;
					if (Number(dieRoll.innerText) >= 6 - critRange) {
						dieRoll.classList.add("max");
						dieRoll.classList.remove("min");
					}
				}
			}
		}
	}

	static renderSettingsConfig(settingsConfig, html) {
		const periciasInput = html.find('input[name="tresdetv.pericias"]');
		const periciasTextarea = $(`<textarea
			style='resize: vertical; min-height: 57px;'
			name='tresdetv.pericias'
			data-dtype='String'
		  >${periciasInput.val()}</textarea>`);
		periciasInput.parent().prepend(periciasTextarea);
		periciasInput.remove();
	}

	static renderSidebarTab(app, html) {
		if (app instanceof Settings) {
			// Jambô Editora
			let jambo = $(`<li class="jambo">
                <a href="https://jamboeditora.com.br/" target="_blank">Jambô Editora</a>
            </li>`);
			html.find("#game-details").append(jambo);
		}
	}
}
