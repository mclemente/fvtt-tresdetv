import * as Trait from "../../documents/actor/trait.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../../helpers/effects.js";
import TraitSelector from "./trait-selector.js";
import ActorTweaks from "./tweaks.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export default class ActorSheetTresDeTV extends ActorSheet {
	_expanded = new Set();

	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["tresdetv", "sheet", "actor", "personagem"],
			width: 500,
			height: 485,
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
	async getData() {
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
		context.config = CONFIG.TRESDETV;
		context.colunasDetalhes = actorData.type === "personagem" ? 4 : 3;

		context.pericias = this._prepareSkills(context.system.pericias);

		context.personagem = actorData.type === "personagem";
		context.pdm = actorData.type === "pdm";
		context.veiculo = actorData.type === "veiculo";

		// Prepare character data and items.
		this._prepareItems(context);
		context.expandedData = {};
		for (const id of this._expanded) {
			const item = this.actor.items.get(id);
			if (item) context.expandedData[id] = await item.getChatData({ secrets: this.actor.isOwner });
		}

		// Prepare NPC data and items.
		// if (actorData.type == "npc") {
		// }

		// Add roll data for TinyMCE editors.
		context.rollData = context.actor.getRollData();

		// Prepare active effects
		context.effects = prepareActiveEffectCategories(this.actor.effects);

		context.descriptionHTML = await TextEditor.enrichHTML(actorData.system.descricao, {
			secrets: actorData.isOwner,
			async: true,
			relativeTo: this.item,
			rollData: context.rollData,
		});

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
	_prepareItems(context) {
		// Initialize containers.
		const itens = [];
		const vantagens = [];
		const desvantagens = [];
		const tecnicas = [];

		// Iterate through items, allocating to containers
		for (let i of context.items) {
			i.isExpanded = this._expanded.has(i._id);
			if (i.type === "item") {
				itens.push(i);
			} else if (i.type === "vantagem") {
				vantagens.push(i);
			} else if (i.type === "desvantagem") {
				desvantagens.push(i);
			} else if (i.type === "tecnica") {
				tecnicas.push(i);
			}
		}

		// Assign and return
		context.itens = itens;
		context.vantagens = vantagens;
		context.desvantagens = desvantagens;
		context.tecnicas = tecnicas;
	}

	_prepareSkills(systemData) {
		const data = foundry.utils.deepClone(systemData);
		if (!data) return {};

		let values = data.value;
		if (!values) values = [];
		else if (values instanceof Set) values = Array.from(values);
		else if (!Array.isArray(values)) values = [values];

		data.selected = values.reduce((obj, key) => {
			obj[key] = Trait.keyLabel("pericia", key) ?? key;
			return obj;
		}, {});

		if (data.custom) data.custom.split(/[,;]/).forEach((c, i) => (data.selected[`custom${i + 1}`] = c.trim()));

		return data;
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

		html.find(".item .item-name.rollable h4").click((event) => this._onItemSummary(event));

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Add Inventory Item
		html.find(".item-create").click(this._onItemCreate.bind(this));

		html.find(".trait-selector").click(this._onTraitSelector.bind(this));

		html.find(".item-toggle").click((ev) => {
			ev.preventDefault();
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			return item.update({ "system.equipped": !foundry.utils.getProperty(item, "system.equipped") });
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
		html.find(".rollable .item-image").click(this._onRoll.bind(this));

		html.find(".ability .dados .rollable").click(this._onRollDice.bind(this));
		html.find(".ability label.rollable").click(this._onRollTest.bind(this));

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
		const data = foundry.utils.duplicate(header.dataset);
		// Initialize a default name.
		const name = type.capitalize();
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			system: data,
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system.type;

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	async _onItemSummary(event) {
		event.preventDefault();
		const li = $(event.currentTarget).parents(".item");
		const item = this.actor.items.get(li.data("item-id"));

		// Toggle summary
		if (li.hasClass("expanded")) {
			const summary = li.children(".item-summary");
			summary.slideUp(200, () => summary.remove());
			this._expanded.delete(item.id);
		} else {
			const chatData = await item.getChatData({ secrets: this.actor.isOwner });
			const summary = $(await renderTemplate("systems/tresdetv/templates/item/parts/item-summary.hbs", chatData));
			li.append(summary.hide());
			summary.slideDown(200);
			this._expanded.add(item.id);
		}
		li.toggleClass("expanded");
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onRoll(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest(".item").dataset.itemId;
		const item = this.actor.items.get(itemId);
		return item.displayCard(event);
	}

	_onRollDice(event) {
		event.preventDefault();
		const configure = !event.altKey && !event.ctrlKey && !event.shiftKey;
		const { key, dice } = event.currentTarget.dataset;
		this.actor.rollTest(key, event, { dice, configure });
	}

	_onRollTest(event) {
		event.preventDefault();
		const key = event.currentTarget.dataset.key;
		this.actor.rollTest(key, event, {});
	}

	/**
	 * Handle spawning the TraitSelector application which allows a checkbox of multiple trait options.
	 * @param {Event} event      The click event which originated the selection.
	 * @returns {TraitSelector}  Newly displayed application.
	 * @private
	 */
	_onTraitSelector(event) {
		event.preventDefault();
		const trait = event.currentTarget.dataset.trait;
		return new TraitSelector(this.actor, trait).render(true);
	}

	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();
		buttons.unshift({
			label: "Ajustes",
			class: "configure-sheet",
			icon: "fas fa-gears",
			onclick: (ev) => new ActorTweaks(this.actor).render(true),
		});
		return buttons;
	}
}
