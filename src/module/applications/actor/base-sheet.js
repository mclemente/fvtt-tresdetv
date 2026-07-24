import * as Trait from "../../documents/actor/trait.js";

import { onManageActiveEffect, prepareActiveEffectCategories } from "../../helpers/effects.js";

import TraitSelector from "./trait-selector.js";
import ActorTweaks from "./tweaks.js";

/**
 * Ficha principal dos Actors do sistema 3DeT Victory.
 *
 * @extends {foundry.applications.sheets.ActorSheetV2}
 */
export default class ActorSheetTresDeTV extends foundry.applications.sheets.ActorSheetV2 {
	/**
	 * IDs dos Items com o resumo expandido.
	 *
	 * @type {Set<string>}
	 */
	_expanded = new Set();

	/**
	 * Aba atualmente selecionada.
	 *
	 * @type {string}
	 */
	_activeTab = "features";

	/**
	 * Configurações da ficha no padrão ApplicationV2.
	 */
	static DEFAULT_OPTIONS = {
		classes: ["tresdetv", "sheet", "actor", "personagem"],

		position: {
			width: 620,
			height: 700,
		},

		dragDrop: [
			{
				dragSelector: ".items-list .item",
			},
		],

		actions: {
			/**
			 * Abre a janela de ajustes do Actor.
			 */
			configureTresDeTVActor() {
				return new ActorTweaks(this.actor).render(true);
			},
		},
	};

	/**
	 * Caminho do template da ficha.
	 *
	 * @returns {string}
	 */
	get template() {
		const path = "systems/tresdetv/templates/actor";

		if (!game.user.isGM && this.actor.limited) {
			return `${path}/limited-sheet.html`;
		}

		return `${path}/actor-sheet.html`;
	}

	/**
	 * Prepara os dados enviados ao template.
	 *
	 * @param {object} options Opções da renderização.
	 * @returns {Promise<object>}
	 */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		const actor = this.actor ?? this.document ?? context.document;

		const actorData = actor.toObject(false);

		context.actor = actor;
		context.system = actorData.system;
		context.flags = actorData.flags;
		context.config = CONFIG.TRESDETV;

		context.editable = this.isEditable;

		context.isGM = game.user.isGM;

		context.karma = Boolean(actor.effects.find((effect) => effect.statuses.has("karma")));

		context.pericias = this._prepareSkills(context.system?.pericias);

		context.personagem = actorData.type === "personagem";

		context.pdm = actorData.type === "pdm";

		context.veiculo = actorData.type === "veiculo";

		context.items = Array.from(actor.items.values());

		context.tabs = this._prepareTabsContext();

		this._prepareItems(context);

		context.expandedData = {};

		for (const id of this._expanded) {
			const item = actor.items.get(id);

			if (!item) {
				continue;
			}

			context.expandedData[id] = await item.getChatData({
				secrets: actor.isOwner,
			});
		}

		context.rollData = actor.getRollData();

		context.effects = prepareActiveEffectCategories(actor.effects);

		const enrichmentOptions = {
			secrets: actor.isOwner,
			async: true,
			relativeTo: actor,
			rollData: context.rollData,
		};

		context.descricaoHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			actorData.system?.descricao ?? "",
			enrichmentOptions,
		);

		context.historiaHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			actorData.system?.historia ?? "",
			enrichmentOptions,
		);

		return context;
	}

	/**
	 * Prepara o estado visual das abas.
	 *
	 * @returns {object}
	 */
	_prepareTabsContext() {
		const createTab = (id, label) => {
			const active = this._activeTab === id;

			return {
				id,
				label,
				group: "primary",
				active,

				cssClass: active ? "active" : "",
			};
		};

		return {
			features: createTab("features", "Ficha"),

			notes: createTab("notes", "Anotações"),

			effects: createTab("effects", "Efeitos"),
		};
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
	}

	/* -------------------------------------------- */
	/*  Preparação dos Items                        */
	/* -------------------------------------------- */

	/**
	 * Separa os Items por categoria.
	 *
	 * @param {object} context Contexto da ficha.
	 * @returns {void}
	 */
	_prepareItems(context) {
		const itens = [];
		const vantagens = [];
		const desvantagens = [];
		const tecnicas = [];

		const items = Array.from(context.items ?? this.actor.items.values());

		for (const item of items) {
			item.isExpanded = this._expanded.has(item.id);

			switch (item.type) {
				case "item":
					itens.push(item);
					break;

				case "vantagem":
					vantagens.push(item);
					break;

				case "desvantagem":
					desvantagens.push(item);
					break;

				case "tecnica":
					tecnicas.push(item);
					break;
			}
		}

		context.itens = itens;
		context.vantagens = vantagens;

		context.desvantagens = desvantagens;

		context.tecnicas = tecnicas;
	}

	/**
	 * Prepara as perícias selecionadas.
	 *
	 * @param {object} systemData Dados das perícias.
	 * @returns {object}
	 */
	_prepareSkills(systemData) {
		const data = foundry.utils.deepClone(systemData);

		if (!data) {
			return {};
		}

		let values = data.value;

		if (!values) {
			values = [];
		} else if (values instanceof Set) {
			values = Array.from(values);
		} else if (!Array.isArray(values)) {
			values = [values];
		}

		data.selected = values.reduce((selected, key) => {
			selected[key] = Trait.keyLabel("pericia", key) ?? key;

			return selected;
		}, {});

		if (data.custom) {
			data.custom.split(/[,;]/).forEach((custom, index) => {
				const value = custom.trim();

				if (value) {
					data.selected[`custom${index + 1}`] = value;
				}
			});
		}

		return data;
	}

	/* -------------------------------------------- */
	/*  Listeners                                   */
	/* -------------------------------------------- */

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
		 * Editor de Anotações e História.
		 */
		html.find(".rich-text-edit").on("click", this._onEditRichText.bind(this));

		/*
		 * Abre a ficha de um Item.
		 */
		html.find(".item-edit").on("click", (event) => {
			event.preventDefault();

			const itemId = event.currentTarget.closest(".item")?.dataset.itemId;

			this.actor.items.get(itemId)?.sheet.render(true);
		});

		/*
		 * Expande o resumo de um Item.
		 */
		html.find(".item .item-name.rollable h4").on("click", this._onItemSummary.bind(this));

		if (!this.isEditable) {
			return;
		}

		/*
		 * Salva os campos comuns.
		 */
		html.find("form").on(
			"change",
			["input[name]", "select[name]", "textarea[name]"].join(", "),
			this._onFieldChange.bind(this),
		);

		/*
		 * Alterna Karma.
		 */
		html.find("button[data-action='toggleDarma']").on("click", async (event) => {
			event.preventDefault();

			await this.actor.toggleStatusEffect("karma");
		});

		/*
		 * Cria um Item.
		 */
		html.find(".item-create").on("click", this._onItemCreate.bind(this));

		/*
		 * Abre o seletor de perícias.
		 */
		html.find(".trait-selector").on("click", this._onTraitSelector.bind(this));

		/*
		 * Equipa ou desequipa um Item.
		 */
		html.find(".item-toggle").on("click", async (event) => {
			event.preventDefault();

			const itemId = event.currentTarget.closest(".item")?.dataset.itemId;

			const item = this.actor.items.get(itemId);

			if (!item) {
				return;
			}

			await item.update({
				"system.equipped": !foundry.utils.getProperty(item, "system.equipped"),
			});
		});

		/*
		 * Exclui um Item.
		 */
		html.find(".item-delete").on("click", async (event) => {
			event.preventDefault();

			const itemId = event.currentTarget.closest(".item")?.dataset.itemId;

			const item = this.actor.items.get(itemId);

			if (item) {
				await item.delete();
			}
		});

		/*
		 * Gerenciamento de efeitos.
		 */
		html.find(".effect-control").on("click", (event) => {
			onManageActiveEffect(event, this.actor);
		});

		/*
		 * Exibe o cartão do Item.
		 */
		html.find(".rollable .item-image").on("click", this._onRoll.bind(this));

		/*
		 * Rolagem de 1D, 2D ou 3D.
		 */
		html.find(".ability .dados .rollable").on("click", this._onRollDice.bind(this));

		/*
		 * Rolagem padrão de atributo.
		 */
		html.find(".ability label.rollable").on("click", this._onRollTest.bind(this));

		/*
		 * Permite arrastar Items.
		 */
		if (this.actor.isOwner) {
			const handler = (event) => this._onDragStart(event);

			html.find("li.item").each((index, element) => {
				if (element.classList.contains("inventory-header")) {
					return;
				}

				element.setAttribute("draggable", "true");

				element.addEventListener("dragstart", handler, false);
			});
		}
	}

	/* -------------------------------------------- */
	/*  Abas                                        */
	/* -------------------------------------------- */

	/**
	 * Troca a aba visível.
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
	 * Salva um campo comum da ficha.
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
			await this.actor.update({
				[name]: value,
			});
		} catch (error) {
			console.error("3DeT Victory | Erro ao salvar campo do Actor.", {
				name,
				value,
				error,
			});

			ui.notifications.error(`Não foi possível salvar o campo ${name}.`);
		}
	}

	/* -------------------------------------------- */
	/*  Editor de texto                             */
	/* -------------------------------------------- */

	/**
	 * Abre o editor de Anotações ou História.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {Promise<void>}
	 */
	async _onEditRichText(event) {
		event.preventDefault();

		if (!this.isEditable) {
			return;
		}

		const fieldPath = event.currentTarget.dataset.field;

		const title = event.currentTarget.dataset.title ?? "Editar texto";

		if (!fieldPath) {
			ui.notifications.error("3DeT Victory | O caminho do campo de texto não foi informado.");

			return;
		}

		const currentValue = foundry.utils.getProperty(this.actor, fieldPath) ?? "";

		const htmlField = new foundry.data.fields.HTMLField({
			required: false,
			nullable: false,
			initial: "",
		});

		/*
		 * Importante:
		 *
		 * A div externa do conteúdo do DialogV2
		 * precisa ficar completamente sem atributos.
		 *
		 * Não adicionar class, id, style ou dataset.
		 */
		const content = document.createElement("div");

		const formGroup = htmlField.toFormGroup(
			{
				label: title,
			},
			{
				name: "content",
				value: currentValue,

				elementType: "prose-mirror",

				toggled: false,
				collaborate: false,

				documentUUID: this.actor.uuid,

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
			this._activeTab = "notes";

			await this.actor.update({
				[fieldPath]: result,
			});
		} catch (error) {
			console.error("3DeT Victory | Erro ao salvar texto rico.", {
				fieldPath,
				result,
				error,
			});

			ui.notifications.error(`Não foi possível salvar ${title}.`);
		}
	}

	/* -------------------------------------------- */
	/*  Items                                       */
	/* -------------------------------------------- */

	/**
	 * Cria um novo Item.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {Promise<Item>}
	 */
	async _onItemCreate(event) {
		event.preventDefault();

		const type = event.currentTarget.dataset.type;

		if (!type) {
			throw new Error("3DeT Victory | O botão não informou o tipo do Item.");
		}

		const system = foundry.utils.deepClone(event.currentTarget.dataset);

		delete system.type;

		return Item.create(
			{
				name: type.charAt(0).toUpperCase() + type.slice(1),

				type,
				system,
			},
			{
				parent: this.actor,
				renderSheet: true,
			},
		);
	}

	/**
	 * Expande ou fecha o resumo de um Item.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {Promise<void>}
	 */
	async _onItemSummary(event) {
		event.preventDefault();

		const element = event.currentTarget.closest(".item");

		const item = this.actor.items.get(element?.dataset.itemId);

		if (!item) {
			return;
		}

		const listItem = $(element);

		if (listItem.hasClass("expanded")) {
			const summary = listItem.children(".item-summary");

			summary.slideUp(200, () => summary.remove());

			this._expanded.delete(item.id);
		} else {
			const chatData = await item.getChatData({
				secrets: this.actor.isOwner,
			});

			const summaryHTML = await foundry.applications.handlebars.renderTemplate(
				"systems/tresdetv/templates/item/parts/item-summary.hbs",
				chatData,
			);

			const summary = $(summaryHTML);

			listItem.append(summary.hide());

			summary.slideDown(200);

			this._expanded.add(item.id);
		}

		listItem.toggleClass("expanded");
	}

	/* -------------------------------------------- */
	/*  Rolagens                                    */
	/* -------------------------------------------- */

	/**
	 * Exibe o cartão do Item.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {Promise<unknown> | undefined}
	 */
	_onRoll(event) {
		event.preventDefault();

		const itemId = event.currentTarget.closest(".item")?.dataset.itemId;

		return this.actor.items.get(itemId)?.displayCard(event);
	}

	/**
	 * Executa uma rolagem específica.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {void}
	 */
	_onRollDice(event) {
		event.preventDefault();

		const configure = !event.altKey && !event.ctrlKey && !event.shiftKey;

		const { key, dice } = event.currentTarget.dataset;

		this.actor.rollTest(key, event, {
			dice,
			configure,
		});
	}

	/**
	 * Executa a rolagem padrão.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {void}
	 */
	_onRollTest(event) {
		event.preventDefault();

		this.actor.rollTest(event.currentTarget.dataset.key, event, {});
	}

	/**
	 * Abre o seletor de perícias.
	 *
	 * @param {Event} event Evento de clique.
	 * @returns {TraitSelector}
	 */
	_onTraitSelector(event) {
		event.preventDefault();

		return new TraitSelector(
			this.actor,

			event.currentTarget.dataset.trait,
		).render(true);
	}

	/**
	 * Controles do cabeçalho.
	 *
	 * @returns {Array<object>}
	 */
	_getHeaderControls() {
		const controls = super._getHeaderControls();

		controls.unshift({
			label: "Ajustes",

			icon: "fa-solid fa-gears",

			action: "configureTresDeTVActor",
		});

		return controls;
	}
}
