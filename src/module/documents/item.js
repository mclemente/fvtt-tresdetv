/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export default class ItemTresDeTV extends Item {
	static getDefaultArtwork(itemData) {
		if (itemData.type === "vantagem") {
			return { img: "icons/svg/upgrade.svg" };
		} else if (itemData.type === "desvantagem") {
			return { img: "icons/svg/downgrade.svg" };
		} else if (itemData.type === "pericia") {
			return { img: "icons/svg/d20.svg" };
		} else if (itemData.type === "tecnica") {
			return { img: "icons/svg/book.svg" };
		}
		return { img: this.DEFAULT_ICON };
	}

	/**
	 * Augment the basic Item data model with additional dynamic data.
	 */
	prepareData() {
		// As with the actor class, items are documents that can have their data
		// preparation methods overridden (such as prepareBaseData()).
		super.prepareData();
	}

	prepareDerivedData() {
		super.prepareDerivedData();
	}

	// async _preCreate(data, options, user) {
	// 	await super._preCreate(data, options, user);
	// 	const sourceId = this.getFlag("core", "sourceId");
	// 	if (sourceId?.startsWith("Compendium.")) return;
	// }

	/* ----------------- */

	async displayCard(options = {}) {
		// Render the chat card template
		const token = this.actor.token;
		const templateData = {
			actor: this.actor,
			tokenId: token?.uuid || null,
			item: this,
			data: await this.getChatData(),
		};
		const html = await renderTemplate("systems/tresdetv/templates/chat/item-card.hbs", templateData);

		// Create the ChatMessage data object
		const chatData = {
			user: game.user.id,
			type: CONST.CHAT_MESSAGE_TYPES.OTHER,
			content: html,
			flavor: this.system.chatFlavor || this.name,
			speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
			flags: { "core.canPopout": true },
		};

		// Merge in the flags from options
		chatData.flags = foundry.utils.mergeObject(chatData.flags, options.flags);

		// Apply the roll mode to adjust message visibility
		ChatMessage.applyRollMode(chatData, options.rollMode ?? game.settings.get("core", "rollMode"));

		// Create the Chat Message or return its data
		const card = options.createMessage !== false ? await ChatMessage.create(chatData) : chatData;

		return card;
	}

	async getChatData(htmlOptions = {}) {
		const data = this.toObject().system;

		// Rich text description
		data.descricao = await TextEditor.enrichHTML(data.descricao, {
			async: true,
			relativeTo: this,
			rollData: this.getRollData(),
			...htmlOptions,
		});

		// Type specific properties
		data.properties = [
			...(this.system.chatProperties ?? []),
			...(this.system.equippableItemChatProperties ?? []),
			...(this.system.activatedEffectChatProperties ?? []),
		].filter((p) => p);

		return data;
	}

	/**
	 * Get the Actor which is the author of a chat card
	 * @returns {Actor[]}            An Array of Actor documents, if any
	 * @private
	 */
	static _getChatCardTargets() {
		let targets = canvas.tokens.controlled.filter((t) => !!t.actor);
		if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
		if (!targets.length) {
			ui.notifications.warn("Você precisa ter pelo menos um Token controlado para usar esta opção.");
		}
		return targets;
	}

	static _onChatCardToggleContent(event) {
		event.preventDefault();
		const header = event.currentTarget;
		const card = header.closest(".chat-card");
		const content = card.querySelector(".card-content");
		content.style.display = content.style.display === "none" ? "" : "none";
	}
}
