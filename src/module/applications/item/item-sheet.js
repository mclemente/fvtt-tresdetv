import { onManageActiveEffect, prepareActiveEffectCategories } from "../../helpers/effects.js";

/**
 * Ficha dos Items do sistema 3DeT Victory.
 *
 * @extends {foundry.applications.sheets.ItemSheetV2}
 */
export default class ItemSheetTresDeTV extends foundry.applications.sheets.ItemSheetV2 {
	/**
	 * Aba atualmente aberta.
	 *
	 * @type {string}
	 */
	_activeTab = "description";

	/**
	 * Configuração da ficha.
	 */
	static DEFAULT_OPTIONS = {
		classes: ["tresdetv", "sheet", "item"],

		position: {
			width: 500,
			height: 485,
		},
	};

	/**
	 * Escolhe o template conforme o tipo do Item.
	 *
	 * @returns {string}
	 */
	get template() {
		const path = "systems/tresdetv/templates/item";

		const item = this.item;

		if (!game.user.isGM && !this.isEditable) {
			return `${path}/limited-sheet.html`;
		}

		switch (item.type) {
			case "desvantagem":
			case "vantagem":
				return `${path}/vantagem-sheet.html`;

			case "tecnica":
				return `${path}/tecnica-sheet.html`;

			case "item":
			default:
				return `${path}/item-sheet.html`;
		}
	}

	/**
	 * Prepara o contexto da ficha.
	 *
	 * @param {object} options Opções da renderização.
	 * @returns {Promise<object>}
	 */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		/*
		 * No ItemSheetV2, o documento é acessado
		 * através de this.item ou context.document.
		 *
		 * context.item não é criado automaticamente.
		 */
		const item = this.item ?? this.document ?? context.document;

		const itemData = item.toObject(false);

		const actor = this.actor ?? item.parent ?? null;

		/*
		 * Recriamos as propriedades esperadas
		 * pelos templates antigos do sistema.
		 */
		context.item = item;
		context.system = itemData.system;
		context.flags = itemData.flags;

		context.editable = this.isEditable;

		context.isGM = game.user.isGM;

		context.cssClass = `tresdetv sheet item ${item.type}`;

		context.rollData = actor?.getRollData?.() ?? {};

		context.effects = prepareActiveEffectCategories(item.effects);

		if (item.type === "tecnica") {
			context.atrChoices = CONFIG.TRESDETV.atributos;
		}

		context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			itemData.system?.descricao ?? "",
			{
				secrets: item.isOwner,

				async: true,
				relativeTo: item,

				rollData: context.rollData,
			},
		);

		return context;
	}

	/**
	 * Renderiza o template.
	 *
	 * @param {object} context Contexto da ficha.
	 * @param {object} options Opções da renderização.
	 * @returns {Promise<DocumentFragment>}
	 */
	async _renderHTML(context, options) {
		const html = await foundry.applications.handlebars.renderTemplate(this.template, context);

		const template = document.createElement("template");

		template.innerHTML = html.trim();

		return template.content;
	}

	/**
	 * Substitui o conteúdo da ficha.
	 *
	 * @param {DocumentFragment} result Conteúdo renderizado.
	 * @param {HTMLElement} content Conteúdo da janela.
	 * @param {object} options Opções da renderização.
	 * @returns {void}
	 */
	_replaceHTML(result, content, options) {
		content.replaceChildren(...result.childNodes);

		this.activateListeners($(content));

		/*
		 * Os templates atuais não colocam a classe
		 * active automaticamente. Fazemos isso aqui.
		 */
		this._applyActiveTab(content, "primary", this._activeTab);
	}

	/**
	 * Registra os eventos da ficha.
	 *
	 * @param {JQuery} html Conteúdo da ficha.
	 * @returns {void}
	 */
	activateListeners(html) {
		/*
		 * Troca de abas.
		 */
		html.find(".sheet-tabs [data-tab]").on("click", this._onTabChange.bind(this));

		/*
		 * O helper {{editor}} cria um botão
		 * com a classe .editor-edit.
		 *
		 * Como a ficha está sendo renderizada
		 * manualmente, interceptamos o botão.
		 */
		html.find(".editor-edit").on("click", this._onEditDescription.bind(this));

		if (!this.isEditable) {
			return;
		}

		/*
		 * Salva nome, custo, quantidade,
		 * atributos e outros campos.
		 */
		html.find("form").on(
			"change",
			["input[name]", "select[name]", "textarea[name]"].join(", "),
			this._onFieldChange.bind(this),
		);

		/*
		 * Gerenciamento de efeitos ativos.
		 */
		html.find(".effect-control").on("click", (event) => {
			onManageActiveEffect(event, this.item);
		});
	}

	/* -------------------------------------------- */
	/*  Abas                                        */
	/* -------------------------------------------- */

	/**
	 * Troca a aba selecionada.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {void}
	 */
	_onTabChange(event) {
		event.preventDefault();
		event.stopPropagation();

		const tab = event.currentTarget.dataset.tab;

		const group =
			event.currentTarget.dataset.group ??
			event.currentTarget.closest("[data-group]")?.dataset.group ??
			"primary";

		if (!tab) {
			return;
		}

		this._activeTab = tab;

		this._applyActiveTab(this.element, group, tab);
	}

	/**
	 * Aplica visualmente a aba selecionada.
	 *
	 * @param {HTMLElement} root Elemento principal.
	 * @param {string} group Grupo da aba.
	 * @param {string} tab Aba selecionada.
	 * @returns {void}
	 */
	_applyActiveTab(root, group, tab) {
		root.querySelectorAll(
			`.sheet-tabs [data-group="${group}"][data-tab],
				.sheet-tabs[data-group="${group}"] [data-tab]`,
		).forEach((element) => {
			const active = element.dataset.tab === tab;

			element.classList.toggle("active", active);

			element.setAttribute("aria-selected", String(active));
		});

		root.querySelectorAll(`.sheet-body > .tab[data-group="${group}"][data-tab]`).forEach((element) => {
			const active = element.dataset.tab === tab;

			element.classList.toggle("active", active);

			element.hidden = !active;
		});
	}

	/* -------------------------------------------- */
	/*  Salvamento                                  */
	/* -------------------------------------------- */

	/**
	 * Salva um campo do Item.
	 *
	 * @param {Event} event Evento change.
	 * @returns {Promise<void>}
	 */
	async _onFieldChange(event) {
		const field = event.currentTarget;

		const name = field.name;

		if (!name || field.disabled) {
			return;
		}

		if (field.type === "radio" && !field.checked) {
			return;
		}

		let value;

		if (field.type === "checkbox") {
			value = field.checked;
		} else if (field.tagName === "SELECT" && field.multiple) {
			value = Array.from(field.selectedOptions).map((option) => option.value);
		} else if (field.type === "number" || field.type === "range" || field.dataset.dtype === "Number") {
			value = field.value === "" ? 0 : Number(field.value);
		} else if (field.dataset.dtype === "Boolean") {
			value = field.value === "true";
		} else {
			value = field.value;
		}

		try {
			await this.item.update({
				[name]: value,
			});
		} catch (error) {
			console.error("3DeT Victory | Erro ao salvar campo do Item.", {
				name,
				value,
				error,
			});

			ui.notifications.error(`Não foi possível salvar o campo ${name}.`);
		}
	}

	/* -------------------------------------------- */
	/*  Editor da descrição                         */
	/* -------------------------------------------- */

	/**
	 * Abre o editor da descrição do Item.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {Promise<void>}
	 */
	async _onEditDescription(event) {
		event.preventDefault();

		if (!this.isEditable) {
			return;
		}

		const fieldPath = "system.descricao";

		const title = `Descrição: ${this.item.name}`;

		const currentValue = foundry.utils.getProperty(this.item, fieldPath) ?? "";

		const htmlField = new foundry.data.fields.HTMLField({
			required: false,
			nullable: false,
			initial: "",
		});

		/*
		 * A div externa deve permanecer sem
		 * qualquer atributo para o DialogV2.
		 */
		const content = document.createElement("div");

		const formGroup = htmlField.toFormGroup(
			{
				label: "Descrição",
			},
			{
				name: "content",
				value: currentValue,

				elementType: "prose-mirror",

				toggled: false,
				collaborate: false,

				documentUUID: this.item.uuid,

				height: 360,
			},
		);

		content.append(formGroup);

		const result = await foundry.applications.api.DialogV2.input({
			window: {
				title,
			},

			content,
			modal: true,
			rejectClose: false,

			position: {
				width: 650,
				height: 550,
			},

			ok: {
				label: "Salvar",

				icon: "fa-solid fa-floppy-disk",

				callback: async (dialogEvent, dialogButton) => {
					const editor =
						dialogButton.form.elements.content ??
						dialogButton.form.querySelector('prose-mirror[name="content"]');

					if (typeof editor?.save === "function") {
						await editor.save();
					}

					return editor?.value ?? "";
				},
			},
		});

		if (result === null) {
			return;
		}

		try {
			this._activeTab = "description";

			await this.item.update({
				[fieldPath]: result,
			});
		} catch (error) {
			console.error("3DeT Victory | Erro ao salvar descrição do Item.", {
				result,
				error,
			});

			ui.notifications.error("Não foi possível salvar a descrição.");
		}
	}
}
