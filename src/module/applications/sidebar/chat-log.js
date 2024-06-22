export default class ChatLogTresDeTV extends ChatLog {
	activateListeners(html) {
		super.activateListeners(html);

		const diceIconSelector = html.find("#chat-controls .chat-control-icon i");
		diceIconSelector.removeClass("fa-dice-d20").addClass("fa-dice-d6");
		html.on("click", ".item-name", tresdetv.documents.ItemTresDeTV._onChatCardToggleContent.bind(this));
	}

	_getEntryContextOptions() {
		const options = super._getEntryContextOptions();
		const canApply = (li) => {
			const message = game.messages.get(li.data("messageId"));
			return message?.isRoll && message?.isContentVisible && canvas.tokens?.controlled.length;
		};
		const isTresDeTVroll = (li) => {
			const message = game.messages.get(li.data("messageId"));
			return message.rolls[0] instanceof CONFIG.Dice.RollTresDeTV;
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
				condition: (li) => canApply(li) && (!isTresDeTVroll(li) || hasTargetMessage(li)),
				callback: (li) => {
					const message = game.messages.get(li.data("messageId"));
					const roll = message.rolls[0];
					const flag = message.getFlag("tresdetv", "targetMessage");
					const dano = roll.options.target - roll.total;
					// Defesa Perfeita
					if (flag && roll.options.target * 2 <= roll.total) return;
					return Promise.all(
						canvas.tokens.controlled.map((token) => {
							const actor = token.actor;
							return actor.applyDamage(Math.max(dano, 1));
						}),
					);
				},
			},
			{
				name: "Aplicar Cura",
				icon: '<i class="fas fa-user-plus"></i>',
				condition: (li) => canApply(li) && (!isTresDeTVroll(li) || !hasTargetMessage(li)),
				callback: (li) => {
					const message = game.messages.get(li.data("messageId"));
					const roll = message.rolls[0];
					return Promise.all(
						canvas.tokens.controlled.map((token) => {
							const actor = token.actor;
							return actor.applyDamage(roll.total, -1);
						}),
					);
				},
			},
			{
				name: "Resistir",
				icon: '<i class="fas fa-shield"></i>',
				condition: (li) => canApply(li) && (!isTresDeTVroll(li) || !hasTargetMessage(li)),
				callback: (li) => {
					const message = game.messages.get(li.data("messageId"));
					const roll = message.rolls[0];
					return Promise.all(
						canvas.tokens.controlled.map((token) => {
							const actor = token.actor;
							return actor.rollTest("resistencia", null, {
								target: roll.total,
								targetMessage: message.id,
							});
						}),
					);
				},
			},
		);
		return options;
	}
}
