import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ActorSheet3DeTV extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["tresdetv", "sheet", "actor", "personagem"],
			width: 550,
			height: 650,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }],
		});
	}

	/** @override */
	get template() {
		const path = "systems/tresdetv/templates/actor";
		if (!game.user.isGM && this.actor.limited) return `${path}/limited-sheet.html`;
		return `${path}/actor-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = this.actor.toObject(false);

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = actorData.system;
		context.flags = actorData.flags;
		context.config = CONFIG.tresdetv;

		// Prepare character data and items.
		this._prepareItems(context);
		if (actorData.type == "personagem") {
			this._prepareCharacterData(context);
		}

		// Prepare NPC data and items.
		// if (actorData.type == "npc") {
		// }

		// Add roll data for TinyMCE editors.
		context.rollData = context.actor.getRollData();

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.actor.effects);

		context.isGM = game.user.isGM;

		return context;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	// eslint-disable-next-line no-unused-vars
	_prepareCharacterData(context) {}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	_prepareItems(context) {
		// Initialize containers.
		const itens = [];
		const vantagens = [];
		const desvantagens = [];
		const tecnicas = [];
		const pericias = [];

		// Iterate through items, allocating to containers
		for (let i of context.items) {
			i.img = i.img || DEFAULT_TOKEN;
			if (i.type === "item") {
				itens.push(i);
			} else if (i.type === "vantagem") {
				vantagens.push(i);
			} else if (i.type === "desvantagem") {
				desvantagens.push(i);
			} else if (i.type === "tecnica") {
				tecnicas.push(i);
			} else if (i.type === "pericia") {
				pericias.push(i);
			}
		}

		// Assign and return
		context.itens = itens;
		context.vantagens = vantagens;
		context.desvantagens = desvantagens;
		context.tecnicas = tecnicas;
		context.pericias = pericias;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.find(".item-edit").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Add Inventory Item
		html.find(".item-create").click(this._onItemCreate.bind(this));

		html.find(".item-toggle").click((ev) => {
			ev.preventDefault();
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			return item.update({ ["system.equipped"]: !foundry.utils.getProperty(item, "system.equipped") });
		});

		// Delete Inventory Item
		html.find(".item-delete").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		// Active Effect management
		html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.actor));

		// Rollable abilities.
		html.find(".item .rollable").click(this._onRoll.bind(this));

		html.find(".ability .rollable").click(this._onRollTest.bind(this));

		// Drag events for macros.
		if (this.actor.owner) {
			let handler = (ev) => this._onDragStart(ev);
			html.find("li.item").each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = duplicate(header.dataset);
		// Initialize a default name.
		let itemName = type.capitalize();
		const name = game.i18n.format("TRESDETV.NewItem", {
			new: game.i18n.localize("TRESDETV.New"),
			item: itemName,
		});
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			system: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system["type"];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.rollType == "item") {
			const itemId = element.closest(".item").dataset.itemId;
			const item = this.actor.items.get(itemId);
			if (item) {
				return item.roll(event);
			}
		}
	}

	_onRollTest(event) {
		event.preventDefault();
		const key = event.currentTarget.dataset.key;
		this.actor.rollTest(key, { event });
	}
}
