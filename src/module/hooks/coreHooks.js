import ItemTresDeTV from "../documents/item";
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

	static renderChatLog(app, html, data) {
		html.on("click", ".item-name", ItemTresDeTV._onChatCardToggleContent.bind(this));
	}

	static renderChatPopout(app, html, data) {
		this.renderChatLog(app, html, data);
	}

	static renderChatMessage(message, html, data) {
		if (message.isRoll && message.isContentVisible && message.rolls.length) {
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

			// Highlight rolls where the first part is a d6 roll
			let d6Roll = message.rolls.find((r) => r.validD6Roll);
			if (d6Roll) {
				if (d6Roll.isCritical) {
					html.find(".dice-total").addClass("critical");
				}
				if (d6Roll.isFumble) {
					html.find(".dice-total").addClass("fumble");
				}
			}
		}
		const chatCard = html.find(".tresdetv.chat-card");
		if (chatCard.length > 0) {
			const flavor = html.find(".flavor-text");
			if (flavor.text() === html.find(".item-name").text()) flavor.remove();
		}
		if (game.settings.get("tresdetv", "autoCollapseItemCards")) html.find(".card-content").hide();
	}

	static renderSettingsConfig(settingsConfig, html) {
		const periciasInput = html.find('input[name="tresdetv.pericias"]');
		const periciasTextarea = $(`<textarea
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
