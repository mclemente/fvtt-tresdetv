export default class CoreHooks {
	static hotbarDrop(bar, data, slot) {
		if (["ActiveEffect", "Item"].includes(data.type)) {
			tresdetv.documents.macro.createMacro(data, slot);
			return false;
		}
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
			const d6Roll = message.rolls.find((r) => r.validD6Roll);
			if (d6Roll) {
				if (d6Roll.isCritical) html.find(".dice-total").addClass("critical");
				else if (d6Roll.isFumble) html.find(".dice-total").addClass("fumble");
				if (d6Roll.options.target) {
					if (d6Roll.total >= d6Roll.options.target) html.find(".dice-total").addClass("success");
					else html.find(".dice-total").addClass("failure");
				}
			}
		}
		const chatCard = html.find(".tresdetv.chat-card");
		if (chatCard.length > 0) {
			const flavor = html.find(".flavor-text");
			if (flavor.text() === html.find(".item-name").text()) flavor.remove();
		}
		const diceFlavor = html.find(".dice-flavor");
		if (diceFlavor.length > 0) {
			const flavorText = html.find(".flavor-text");
			if (flavorText.text().includes(diceFlavor.text())) diceFlavor.remove();
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
