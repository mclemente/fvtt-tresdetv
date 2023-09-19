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

	static onRenderChatMessage(app, html, data) {
		return;
		if (!message.isRoll || !message.isContentVisible || !message.rolls.length) return;

		// Highlight rolls where the first part is a d20 roll
		let rollResult = message.rolls.find((r) => {
			return r.options.success;
		});
		if (!rollResult) return;

		// Highlight successes and failures
		if (rollResult.isSuccess) {
			html.find(".dice-total").addClass("success");
		} else {
			html.find(".dice-total").addClass("failure");
		}
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
