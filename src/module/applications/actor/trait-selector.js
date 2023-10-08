import * as Trait from "../../documents/actor/trait.js";

export default class TraitSelector extends DocumentSheet {
	constructor(actor, trait, options = {}) {
		super(actor, options);

		/**
		 * Trait key as defined in CONFIG.traits.
		 * @type {string}
		 */
		this.trait = trait;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "trait-selector",
			classes: ["tresdetv", "trait-selector", "subconfig"],
			template: "systems/tresdetv/templates/apps/trait-selector.hbs",
			width: 320,
			height: "auto",
			sheetConfig: false,
			allowCustom: true,
		});
	}

	get id() {
		return `${this.constructor.name}-${this.trait}-Actor-${this.document.id}`;
	}

	get title() {
		return `${this.document.name}: ${Trait.traitLabel(this.trait)}`;
	}

	async getData() {
		const path = `system.${Trait.actorKeyPath(this.trait)}`;
		const data = foundry.utils.getProperty(this.document, path);
		if (!data) return super.getData();

		return {
			...super.getData(),
			choices: await Trait.choices(this.trait, data.value),
			custom: data.custom,
			customPath: "custom" in data ? `${path}.custom` : null,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		for (const checkbox of html[0].querySelectorAll("input[type='checkbox']")) {
			if (checkbox.checked) this._onToggleCategory(checkbox);
		}
	}

	async _onChangeInput(event) {
		super._onChangeInput(event);

		if (event.target.name?.startsWith("choices")) this._onToggleCategory(event.target);
	}

	_onToggleCategory(checkbox) {
		const children = checkbox.closest("li")?.querySelector("ol");
		if (!children) return;

		for (const child of children.querySelectorAll("input[type='checkbox']")) {
			child.checked = child.disabled = checkbox.checked;
		}
	}

	_prepareChoices(prefix, path, formData) {
		const chosen = [];
		for (const key of Object.keys(formData).filter((k) => k.startsWith(`${prefix}.`))) {
			if (formData[key]) chosen.push(key.replace(`${prefix}.`, ""));
			delete formData[key];
		}
		formData[path] = chosen;
	}

	/* -------------------------------------------- */

	/** @override */
	async _updateObject(event, formData) {
		const path = `system.${Trait.actorKeyPath(this.trait)}`;
		this._prepareChoices("choices", `${path}.value`, formData);
		return this.object.update(formData);
	}
}
