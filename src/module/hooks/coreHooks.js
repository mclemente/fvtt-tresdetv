export default class CoreHooks {
	static hotbarDrop(bar, data, slot) {
		if (["ActiveEffect", "Item"].includes(data.type)) {
			tresdetv.documents.macro.createMacro(data, slot);
			return false;
		}
	}

	static renderChatMessageHTML(message, html, data) {
		if (message.isRoll && message.isContentVisible && message.rolls.length) {
			const critRange = message.getFlag("tresdetv", "critRange");
			if (critRange) {
				const diceRolls = html.querySelector(".dice-rolls").children;
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
				if (d6Roll.isCritical) html.querySelector(".dice-total").classList.add("critical");
				else if (d6Roll.isFumble) html.querySelector(".dice-total").classList.add("fumble");
				if (d6Roll.options.target) {
					if (d6Roll.total >= d6Roll.options.target) html.querySelector(".dice-total").classList.add("success");
					else html.querySelector(".dice-total").addClass("failure");
				}
			}
		}
		const chatCard = html.querySelector(".tresdetv.chat-card");
		if (chatCard) {
			const flavor = html.querySelector(".flavor-text");
			if (flavor.textContent === html.querySelector(".item-name").textContent) flavor.remove();
		}
		const diceFlavor = html.querySelector(".dice-flavor");
		if (diceFlavor) {
			const flavorText = html.querySelector(".flavor-text");
			if (flavorText.textContent.includes(diceFlavor.textContent)) diceFlavor.remove();
		}
		const cardContent = html.querySelector(".card-content");
		if (cardContent && game.settings.get("tresdetv", "autoCollapseItemCards")) cardContent.hidden = true;
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
