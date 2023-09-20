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
			this.updateSource({ img: "icons/svg/d20-black.svg" });
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

		// Initialize chat data.
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");
		const label = `[${item.type}] ${item.name}`;

		ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			flavor: label,
			content: item.system.descricao ?? "",
			event,
		});
	}
}
