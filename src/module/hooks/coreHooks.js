import ItemTresDeTV from "../documents/item";
import { createMacro } from "../documents/macro";

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unreachable */
export default class CoreHooks {
	static getChatLogEntryContext(html, options) {
		const canApply = (li) => {
			const message = game.messages.get(li.data("messageId"));
			return message?.isRoll && message?.isContentVisible && canvas.tokens?.controlled.length;
		};
		const hasTargetMessage = (li) => {
			const message = game.messages.get(li.data("messageId"));
			const flag = message.getFlag("tresdetv", "targetMessage");
			if (!flag) return false;
			const targetMessage = game.messages.get(flag);
			return targetMessage;
		};
		options.push(
			{
				name: "Aplicar Dano",
				icon: '<i class="fas fa-user-minus"></i>',
				condition: (li) => canApply(li) && hasTargetMessage(li),
				callback: (li) => applyChatCardDamage(li, 1),
			},
			{
				name: "Aplicar Cura",
				icon: '<i class="fas fa-user-plus"></i>',
				condition: (li) => canApply(li) && !hasTargetMessage(li),
				callback: (li) => applyChatCardHeal(li, -1),
			},
			{
				name: "Resistir",
				icon: '<i class="fas fa-shield"></i>',
				condition: (li) => canApply(li) && !hasTargetMessage(li),
				callback: (li) => rollResist(li),
			},
		);
		return options;
	}

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

function applyChatCardDamage(li, multiplier) {
	const message = game.messages.get(li.data("messageId"));
	const roll = message.rolls[0];
	const flag = message.getFlag("tresdetv", "targetMessage");
	const targetMessage = game.messages.get(flag);
	const damage = targetMessage.rolls[0];
	const dano = roll.total - damage.total;
	const defesaTotal = dano + roll.total === 0;
	if (defesaTotal) return;
	return Promise.all(
		canvas.tokens.controlled.map((token) => {
			const actor = token.actor;
			return actor.applyDamage(Math.max(dano, 1), multiplier);
		}),
	);
}

function applyChatCardHeal(li, multiplier) {
	const message = game.messages.get(li.data("messageId"));
	const roll = message.rolls[0];
	return Promise.all(
		canvas.tokens.controlled.map((token) => {
			const actor = token.actor;
			return actor.applyDamage(roll.total, multiplier);
		}),
	);
}

function rollResist(li) {
	const message = game.messages.get(li.data("messageId"));
	const roll = message.rolls[0];
	return Promise.all(
		canvas.tokens.controlled.map((token) => {
			const actor = token.actor;
			return actor.rollTest("resistencia", null, { target: roll.total, targetMessage: message.id });
		}),
	);
}
