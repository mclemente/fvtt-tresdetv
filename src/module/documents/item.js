/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export default class ItemTresDeTV extends Item {
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

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		if (this.type === "vantagem") {
			this.updateSource({ img: "icons/svg/upgrade.svg" });
		} else if (this.type === "desvantagem") {
			this.updateSource({ img: "icons/svg/downgrade.svg" });
		} else if (this.type === "pericia") {
			this.updateSource({ img: "icons/svg/d20.svg" });
		} else if (this.type === "tecnica") {
			this.updateSource({ img: "icons/svg/book.svg" });
		}
	}

	/* ----------------- */

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async roll(event) {
		const item = this;
		return item.displayCard();
	}

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

	static _onChatCardToggleContent(event) {
		event.preventDefault();
		const header = event.currentTarget;
		const card = header.closest(".chat-card");
		const content = card.querySelector(".card-content");
		content.style.display = content.style.display === "none" ? "" : "none";
	}
}
