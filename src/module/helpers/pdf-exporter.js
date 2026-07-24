const ORIGIN_LABELS = Object.freeze({
	comprada: "Compradas com pontos",
	arquetipo: "Arquétipo",
	kit: "Kit de Arcanauta",
	artefato: "Artefato",
	tecnica: "Técnica ou poder",
	temporaria: "Temporária",
	outra: "Outras origens",
});

const TECHNIQUE_TIERS = Object.freeze({
	truque: {
		label: "Truques",
		itemLabel: "Truque",
		icon: "✦",
		order: 10,
	},

	comum: {
		label: "Técnicas Comuns",
		itemLabel: "Técnica Comum",
		icon: "◆",
		order: 20,
	},

	lendaria: {
		label: "Técnicas Lendárias",
		itemLabel: "Técnica Lendária",
		icon: "★",
		order: 30,
	},
});

/**
 * Exporta um Actor ou Item para uma página A4
 * pronta para ser salva como PDF.
 *
 * A exportação usa o diálogo de impressão nativo
 * do navegador, permitindo múltiplas páginas A4.
 *
 * @param {Actor|Item} document Documento exportado.
 * @returns {Promise<void>}
 */
export async function exportDocumentToPdf(document) {
	if (!document) {
		ui.notifications.error("3DeT Victory | Nenhum documento foi informado para exportação.");

		return;
	}

	/*
	 * A janela precisa ser aberta imediatamente
	 * durante o clique para não ser bloqueada
	 * pelo navegador como pop-up.
	 */
	const printWindow = window.open(
		"",
		"_blank",
		["popup=yes", "width=1180", "height=900", "resizable=yes", "scrollbars=yes"].join(","),
	);

	if (!printWindow) {
		ui.notifications.error("O navegador bloqueou a janela de exportação. Autorize pop-ups para o Foundry.");

		return;
	}

	printWindow.document.open();

	printWindow.document.write(createLoadingDocument(document.name));

	printWindow.document.close();

	try {
		ui.notifications.info(`Preparando o PDF de ${document.name}...`);

		const body =
			document.documentName === "Actor" ? await buildActorDocument(document) : await buildItemDocument(document);

		const title = `3DeT Victory - ${document.name}`;

		const html = createPrintableDocument(title, body);

		printWindow.document.open();
		printWindow.document.write(html);
		printWindow.document.close();

		await waitForPrintAssets(printWindow);

		await wait(250);

		printWindow.onafterprint = () => {
			setTimeout(() => printWindow.close(), 250);
		};

		printWindow.focus();
		printWindow.print();

		ui.notifications.info("Na janela de impressão, selecione “Salvar como PDF”. O tamanho A4 já está configurado.");
	} catch (error) {
		console.error("3DeT Victory | Erro ao exportar a ficha para PDF.", error);

		printWindow.close();

		ui.notifications.error("Não foi possível preparar o PDF. Consulte o console do Foundry.");
	}
}

/**
 * Cria o conteúdo imprimível de um Actor.
 *
 * @param {Actor} actor Actor exportado.
 * @returns {Promise<string>}
 */
async function buildActorDocument(actor) {
	const source = actor.toObject(false);

	const system = source.system ?? {};

	const items = await prepareEmbeddedItems(actor);

	const advantages = items.filter((item) => item.type === "vantagem");

	const disadvantages = items.filter((item) => item.type === "desvantagem");

	const techniques = items.filter((item) => item.type === "tecnica");

	const equipment = items.filter((item) => item.type === "item");

	const description = await enrichRichText(actor, system.descricao ?? "");

	const history = await enrichRichText(actor, system.historia ?? "");

	return `
		<main class="print-document actor-document">
			${buildActorHeader(actor, system)}

			<section class="summary-grid">
				${buildAttributePanel(system)}

				${buildResourcePanel(system)}
			</section>

			${buildSkillsSection(system)}

			${buildOriginItemsSection("Vantagens", advantages, "advantage")}

			${buildOriginItemsSection("Desvantagens", disadvantages, "disadvantage")}

			${buildTechniqueSection(techniques)}

			${buildEquipmentSection(equipment)}

			${buildRichTextSection("Anotações", description)}

			${buildRichTextSection("História", history)}

			${buildEffectsSection(actor.effects)}

			${buildDocumentFooter(actor)}
		</main>
	`;
}

/**
 * Cria o conteúdo imprimível de um Item.
 *
 * @param {Item} item Item exportado.
 * @returns {Promise<string>}
 */
async function buildItemDocument(item) {
	const source = item.toObject(false);

	const system = source.system ?? {};

	const description = await enrichRichText(item, system.descricao ?? "");

	return `
		<main
			class="
				print-document
				item-document
				item-${escapeAttribute(item.type)}
			"
		>
			${buildItemHeader(item)}

			${buildItemMetadata(item, system)}

			${buildRichTextSection("Descrição", description)}

			${buildEffectsSection(item.effects)}

			${buildDocumentFooter(item)}
		</main>
	`;
}

/**
 * Prepara os Items incorporados do Actor,
 * incluindo as descrições enriquecidas.
 *
 * @param {Actor} actor Actor pai.
 * @returns {Promise<Array<object>>}
 */
async function prepareEmbeddedItems(actor) {
	return Promise.all(
		Array.from(actor.items.values()).map(async (item) => {
			const source = item.toObject(false);

			const system = source.system ?? {};

			return {
				id: item.id,
				name: item.name,
				type: item.type,
				img: item.img,
				system,

				description: await enrichRichText(item, system.descricao ?? ""),
			};
		}),
	);
}

/**
 * Cabeçalho visual do Actor.
 *
 * @param {Actor} actor Actor.
 * @param {object} system Dados do sistema.
 * @returns {string}
 */
function buildActorHeader(actor, system) {
	const details = system.detalhes ?? {};

	const points = system.pontos ?? {};

	return `
		<header class="document-header">
			<div class="brand-row">
				<div class="brand-mark">
					<strong>3DeT</strong>
					<span>Victory</span>
				</div>

				<div class="document-kind">
					Ficha de
					${escapeHtml(getActorTypeLabel(actor.type))}
				</div>
			</div>

			<div class="identity-grid">
				${buildPortrait(actor.img, actor.name)}

				<div class="identity-content">
					<p class="eyebrow">
						${escapeHtml(getActorTypeLabel(actor.type))}
					</p>

					<h1>
						${escapeHtml(actor.name)}
					</h1>

					<div class="identity-fields">
						${buildLabeledValue("Arquétipo", details.arquetipo)}

						${buildLabeledValue("Conceito", details.conceito)}

						${buildLabeledValue("Pontos", points.personagem?.value)}

						${buildLabeledValue("XP", points.experiencia?.value)}
					</div>
				</div>
			</div>
		</header>
	`;
}

/**
 * Cabeçalho visual do Item.
 *
 * @param {Item} item Item.
 * @returns {string}
 */
function buildItemHeader(item) {
	return `
		<header class="document-header item-header">
			<div class="brand-row">
				<div class="brand-mark">
					<strong>3DeT</strong>
					<span>Victory</span>
				</div>

				<div class="document-kind">
					Ficha de
					${escapeHtml(getItemTypeLabel(item.type))}
				</div>
			</div>

			<div
				class="
					identity-grid
					item-identity-grid
				"
			>
				${buildPortrait(item.img, item.name)}

				<div class="identity-content">
					<p class="eyebrow">
						${escapeHtml(getItemTypeLabel(item.type))}
					</p>

					<h1>
						${escapeHtml(item.name)}
					</h1>

					${
						item.parent?.name
							? `
								<p class="parent-document">
									Pertence a
									${escapeHtml(item.parent.name)}
								</p>
							`
							: ""
					}
				</div>
			</div>
		</header>
	`;
}

/**
 * Painel dos atributos P, H e R.
 *
 * @param {object} system Dados do Actor.
 * @returns {string}
 */
function buildAttributePanel(system) {
	const attributes = system.atributos ?? {};

	const rows = [
		["P", "Poder", attributes.poder?.value, "power"],

		["H", "Habilidade", attributes.habilidade?.value, "skill"],

		["R", "Resistência", attributes.resistencia?.value, "resistance"],
	];

	return `
		<section class="panel attributes-panel">
			${buildSectionHeading("Atributos", "P, H e R")}

			<div class="attribute-list">
				${rows
					.map(
						([short, label, value, cssClass]) => `
						<div
							class="
								attribute-row
								attribute-${cssClass}
							"
						>
							<span class="attribute-letter">
								${short}
							</span>

							<span class="attribute-name">
								${label}
							</span>

							<strong class="attribute-value">
								${formatValue(value)}
							</strong>
						</div>
					`,
					)
					.join("")}
			</div>
		</section>
	`;
}

/**
 * Painel de PA, PM e PV.
 *
 * @param {object} system Dados do Actor.
 * @returns {string}
 */
function buildResourcePanel(system) {
	const points = system.pontos ?? {};

	const rows = [
		["PA", "Ação", points.acao, "action"],

		["PM", "Mana", points.mana, "mana"],

		["PV", "Vida", points.vida, "life"],
	];

	return `
		<section class="panel resources-panel">
			${buildSectionHeading("Recursos", "Atual / máximo")}

			<div class="resource-list">
				${rows
					.map(
						([short, label, resource, cssClass]) => `
						<div
							class="
								resource-row
								resource-${cssClass}
							"
						>
							<div>
								<strong>
									${short}
								</strong>

								<span>
									${label}
								</span>
							</div>

							<p>
								<b>
									${formatValue(resource?.value)}
								</b>

								<span>/</span>

								<b>
									${formatValue(resource?.max)}
								</b>
							</p>
						</div>
					`,
					)
					.join("")}
			</div>
		</section>
	`;
}

/**
 * Seção de Perícias.
 *
 * @param {object} system Dados do Actor.
 * @returns {string}
 */
function buildSkillsSection(system) {
	const skills = prepareSkills(system.pericias);

	return `
		<section
			class="
				content-section
				compact-section
			"
		>
			${buildSectionHeading("Perícias", `${skills.length} selecionada(s)`)}

			${
				skills.length
					? `
						<div class="chip-list">
							${skills
								.map(
									(skill) => `
									<span class="chip">
										${escapeHtml(skill)}
									</span>
								`,
								)
								.join("")}
						</div>
					`
					: buildEmptyState("Nenhuma perícia selecionada.")
			}
		</section>
	`;
}

/**
 * Seção de Vantagens ou Desvantagens,
 * agrupadas por origem.
 *
 * @param {string} title Título.
 * @param {Array<object>} items Itens.
 * @param {string} cssClass Classe visual.
 * @returns {string}
 */
function buildOriginItemsSection(title, items, cssClass) {
	const groups = groupItemsByOrigin(items);

	return `
		<section
			class="
				content-section
				${cssClass}-section
			"
		>
			${buildSectionHeading(title, `${items.length} cadastrada(s)`)}

			${
				groups.length
					? groups
							.map(
								(group) => `
							<div
								class="
									group-block
									origin-block
									origin-${escapeAttribute(group.type)}
								"
							>
								<div class="group-title">
									<strong>
										${escapeHtml(group.label)}
									</strong>

									<span>
										${group.items.length}
									</span>
								</div>

								<div class="entry-list">
									${group.items.map((item) => buildItemEntry(item, cssClass)).join("")}
								</div>
							</div>
						`,
							)
							.join("")
					: buildEmptyState(`Nenhuma ${title.toLocaleLowerCase("pt-BR")} cadastrada.`)
			}
		</section>
	`;
}

/**
 * Seção de Técnicas agrupadas por nível.
 *
 * @param {Array<object>} items Técnicas.
 * @returns {string}
 */
function buildTechniqueSection(items) {
	const groups = groupTechniques(items);

	return `
		<section
			class="
				content-section
				techniques-section
			"
		>
			${buildSectionHeading("Técnicas", `${items.length} cadastrada(s)`)}

			${groups
				.map(
					(group) => `
					<div
						class="
							group-block
							tier-block
							tier-${escapeAttribute(group.key)}
						"
					>
						<div
							class="
								group-title
								tier-title
							"
						>
							<strong>
								<span class="tier-symbol">
									${group.icon}
								</span>

								${escapeHtml(group.label)}
							</strong>

							<span>
								${group.items.length}
							</span>
						</div>

						${
							group.items.length
								? `
									<div class="entry-list">
										${group.items.map((item) => buildTechniqueEntry(item, group)).join("")}
									</div>
								`
								: buildEmptyState("Nenhuma técnica nesta categoria.")
						}
					</div>
				`,
				)
				.join("")}
		</section>
	`;
}

/**
 * Seção de equipamento.
 *
 * @param {Array<object>} items Equipamentos.
 * @returns {string}
 */
function buildEquipmentSection(items) {
	return `
		<section
			class="
				content-section
				equipment-section
			"
		>
			${buildSectionHeading("Equipamento", `${items.length} cadastrado(s)`)}

			${
				items.length
					? `
						<div
							class="
								entry-list
								equipment-list
							"
						>
							${items.map((item) => buildEquipmentEntry(item)).join("")}
						</div>
					`
					: buildEmptyState("Nenhum equipamento cadastrado.")
			}
		</section>
	`;
}

/**
 * Seção de texto rico.
 *
 * @param {string} title Título.
 * @param {string} html HTML seguro.
 * @returns {string}
 */
function buildRichTextSection(title, html) {
	return `
		<section
			class="
				content-section
				rich-section
			"
		>
			${buildSectionHeading(title)}

			<div class="rich-text">
				${
					html ||
					`
						<p class="empty-text">
							Nenhum conteúdo informado.
						</p>
					`
				}
			</div>
		</section>
	`;
}

/**
 * Seção dos Active Effects.
 *
 * @param {Collection<ActiveEffect>|ActiveEffect[]} effects Efeitos.
 * @returns {string}
 */
function buildEffectsSection(effects) {
	const entries = Array.from(effects ?? []).map((effect) => ({
		name: effect.name,

		disabled: Boolean(effect.disabled),

		source: effect.sourceName ?? "-",

		duration: effect.duration?.label ?? "-",
	}));

	return `
		<section
			class="
				content-section
				effects-section
			"
		>
			${buildSectionHeading("Efeitos", `${entries.length} cadastrado(s)`)}

			${
				entries.length
					? `
						<div class="effects-table">
							<div class="effects-table-header">
								<span>Efeito</span>
								<span>Fonte</span>
								<span>Duração</span>
								<span>Estado</span>
							</div>

							${entries
								.map(
									(effect) => `
									<div class="effects-table-row">
										<strong>
											${escapeHtml(effect.name)}
										</strong>

										<span>
											${escapeHtml(effect.source)}
										</span>

										<span>
											${escapeHtml(effect.duration)}
										</span>

										<span
											class="
												effect-state
												${effect.disabled ? "disabled" : "active"}
											"
										>
											${effect.disabled ? "Inativo" : "Ativo"}
										</span>
									</div>
								`,
								)
								.join("")}
						</div>
					`
					: buildEmptyState("Nenhum efeito cadastrado.")
			}
		</section>
	`;
}

/**
 * Metadados específicos de cada tipo de Item.
 *
 * @param {Item} item Item.
 * @param {object} system Dados do sistema.
 * @returns {string}
 */
function buildItemMetadata(item, system) {
	const commonCards = [];

	if (item.type === "vantagem" || item.type === "desvantagem") {
		const origin = prepareOrigin(system.origem);

		const affected = Object.entries(system.afeta ?? {})
			.filter(([, value]) => Boolean(value))
			.map(([key]) => toTitle(key));

		commonCards.push(
			buildMetadataCard("Custo", `${formatValue(system.custo)} pt`),

			buildMetadataCard("Origem", origin.label),

			buildMetadataCard("Atributos afetados", affected.length ? affected.join(", ") : "Nenhum"),
		);
	}

	if (item.type === "tecnica") {
		const tier = TECHNIQUE_TIERS[system.categoria] ?? TECHNIQUE_TIERS.comum;

		const activation = system.ativacao ?? {};

		const duration = system.duracao ?? {};

		commonCards.push(
			buildMetadataCard("Categoria", tier.itemLabel),

			buildMetadataCard("Requisitos", activation.requisitos),

			buildMetadataCard("Alcance", activation.alcance),

			buildMetadataCard("Custo", activation.custo ? `${activation.custo} PM` : "-"),

			buildMetadataCard("Teste", getAttributeLabel(activation.teste)),

			buildMetadataCard("Duração", formatDuration(duration)),
		);
	}

	if (item.type === "item") {
		commonCards.push(
			buildMetadataCard("Quantidade", system.quantidade),

			buildMetadataCard("Valor", system.valor),

			buildMetadataCard("Equipado", system.equipped ? "Sim" : "Não"),
		);
	}

	if (!commonCards.length) {
		return "";
	}

	return `
		<section
			class="
				content-section
				metadata-section
			"
		>
			${buildSectionHeading("Informações")}

			<div class="metadata-grid">
				${commonCards.join("")}
			</div>
		</section>
	`;
}

/**
 * Entrada de Vantagem ou Desvantagem.
 *
 * @param {object} item Item preparado.
 * @param {string} cssClass Classe visual.
 * @returns {string}
 */
function buildItemEntry(item, cssClass) {
	const cost = item.system.custo;

	return `
		<article
			class="
				entry
				item-entry
				${cssClass}-entry
				${item.description ? "has-description" : ""}
			"
		>
			<div class="entry-heading">
				<strong>
					${escapeHtml(item.name)}
				</strong>

				${
					cost !== undefined && cost !== null && cost !== ""
						? `
							<span class="entry-badge">
								${escapeHtml(String(cost))}
								pt
							</span>
						`
						: ""
				}
			</div>

			${
				item.description
					? `
						<div class="entry-description">
							${item.description}
						</div>
					`
					: ""
			}
		</article>
	`;
}

/**
 * Entrada de Técnica.
 *
 * @param {object} item Técnica.
 * @param {object} group Grupo da técnica.
 * @returns {string}
 */
function buildTechniqueEntry(item, group) {
	const activation = item.system.ativacao ?? {};

	const duration = item.system.duracao ?? {};

	const formattedDuration = formatDuration(duration);

	const meta = [
		activation.requisitos ? `Requisitos: ${activation.requisitos}` : "",

		activation.alcance ? `Alcance: ${activation.alcance}` : "",

		activation.custo ? `Custo: ${activation.custo} PM` : "",

		activation.teste ? `Teste: ${getAttributeLabel(activation.teste)}` : "",

		formattedDuration !== "-" ? `Duração: ${formattedDuration}` : "",
	].filter(Boolean);

	return `
		<article
			class="
				entry
				technique-entry
				${group.key === "lendaria" ? "legendary-entry" : ""}
				${item.description ? "has-description" : ""}
			"
		>
			<div class="entry-heading">
				<strong>
					${escapeHtml(item.name)}
				</strong>

				<span
					class="
						entry-badge
						tier-badge
					"
				>
					${group.icon}
					${escapeHtml(group.itemLabel)}
				</span>
			</div>

			${
				meta.length
					? `
						<p class="entry-meta">
							${meta.map((value) => escapeHtml(value)).join(" • ")}
						</p>
					`
					: ""
			}

			${
				item.description
					? `
						<div class="entry-description">
							${item.description}
						</div>
					`
					: ""
			}
		</article>
	`;
}

/**
 * Entrada de equipamento.
 *
 * @param {object} item Equipamento.
 * @returns {string}
 */
function buildEquipmentEntry(item) {
	const system = item.system ?? {};

	const meta = [
		system.quantidade !== undefined ? `Quantidade: ${formatValue(system.quantidade)}` : "",

		system.valor !== undefined ? `Valor: ${formatValue(system.valor)}` : "",

		system.equipped !== undefined ? `Equipado: ${system.equipped ? "Sim" : "Não"}` : "",
	].filter(Boolean);

	return `
		<article
			class="
				entry
				equipment-entry
				${item.description ? "has-description" : ""}
			"
		>
			<div class="entry-heading">
				<strong>
					${escapeHtml(item.name)}
				</strong>
			</div>

			${
				meta.length
					? `
						<p class="entry-meta">
							${meta.map((value) => escapeHtml(value)).join(" • ")}
						</p>
					`
					: ""
			}

			${
				item.description
					? `
						<div class="entry-description">
							${item.description}
						</div>
					`
					: ""
			}
		</article>
	`;
}

/**
 * Rodapé do documento.
 *
 * @param {Actor|Item} document Documento.
 * @returns {string}
 */
function buildDocumentFooter(document) {
	const now = new Date().toLocaleString("pt-BR");

	return `
		<footer class="document-footer">
			<span>
				3DeT Victory para Foundry VTT
			</span>

			<span>
				Exportado em
				${escapeHtml(now)}
			</span>

			<span>
				${escapeHtml(document.uuid)}
			</span>
		</footer>
	`;
}

/**
 * Título de seção.
 *
 * @param {string} title Título.
 * @param {string} subtitle Subtítulo.
 * @returns {string}
 */
function buildSectionHeading(title, subtitle = "") {
	return `
		<header class="section-heading">
			<h2>
				${escapeHtml(title)}
			</h2>

			${
				subtitle
					? `
						<span>
							${escapeHtml(subtitle)}
						</span>
					`
					: ""
			}
		</header>
	`;
}

/**
 * Campo simples do cabeçalho.
 *
 * @param {string} label Rótulo.
 * @param {unknown} value Valor.
 * @returns {string}
 */
function buildLabeledValue(label, value) {
	return `
		<div class="identity-field">
			<span>
				${escapeHtml(label)}
			</span>

			<strong>
				${escapeHtml(formatValue(value))}
			</strong>
		</div>
	`;
}

/**
 * Cartão de metadado.
 *
 * @param {string} label Rótulo.
 * @param {unknown} value Valor.
 * @returns {string}
 */
function buildMetadataCard(label, value) {
	return `
		<div class="metadata-card">
			<span>
				${escapeHtml(label)}
			</span>

			<strong>
				${escapeHtml(formatValue(value))}
			</strong>
		</div>
	`;
}

/**
 * Retrato do documento.
 *
 * @param {string} src Caminho da imagem.
 * @param {string} alt Texto alternativo.
 * @returns {string}
 */
function buildPortrait(src, alt) {
	if (!src) {
		return `
			<div
				class="
					portrait-frame
					portrait-placeholder
				"
			>
				<span>
					Sem imagem
				</span>
			</div>
		`;
	}

	return `
		<div class="portrait-frame">
			<img
				src="${escapeAttribute(src)}"
				alt="${escapeAttribute(alt)}"
			>
		</div>
	`;
}

/**
 * Estado vazio de uma seção.
 *
 * @param {string} text Texto.
 * @returns {string}
 */
function buildEmptyState(text) {
	return `
		<p class="empty-state">
			${escapeHtml(text)}
		</p>
	`;
}

/**
 * Agrupa Vantagens e Desvantagens por origem.
 *
 * @param {Array<object>} items Itens.
 * @returns {Array<object>}
 */
function groupItemsByOrigin(items) {
	const groups = new Map();

	for (const item of items) {
		const origin = prepareOrigin(item.system.origem);

		const key = [origin.type, origin.detail.toLocaleLowerCase("pt-BR")].join(":");

		if (!groups.has(key)) {
			groups.set(key, {
				type: origin.type,
				label: origin.label,
				items: [],
			});
		}

		groups.get(key).items.push(item);
	}

	return Array.from(groups.values()).map((group) => {
		group.items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

		return group;
	});
}

/**
 * Normaliza a origem de uma
 * Vantagem ou Desvantagem.
 *
 * @param {object} origin Origem.
 * @returns {{type: string, detail: string, label: string}}
 */
function prepareOrigin(origin = {}) {
	const rawType = String(origin?.tipo ?? "comprada");

	const type = ORIGIN_LABELS[rawType] ? rawType : "outra";

	const detail = String(origin?.nome ?? "").trim();

	const baseLabel = ORIGIN_LABELS[type];

	return {
		type,
		detail,

		label: detail ? `${baseLabel} - ${detail}` : baseLabel,
	};
}

/**
 * Agrupa Técnicas por categoria.
 *
 * @param {Array<object>} items Técnicas.
 * @returns {Array<object>}
 */
function groupTechniques(items) {
	const groups = Object.entries(TECHNIQUE_TIERS).map(([key, definition]) => ({
		key,
		...definition,
		items: [],
	}));

	for (const item of items) {
		const rawTier = String(item.system.categoria ?? "comum");

		const tier = TECHNIQUE_TIERS[rawTier] ? rawTier : "comum";

		groups.find((group) => group.key === tier).items.push(item);
	}

	for (const group of groups) {
		group.items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
	}

	return groups.sort((a, b) => a.order - b.order);
}

/**
 * Prepara as Perícias selecionadas.
 *
 * @param {object} data Dados de Perícias.
 * @returns {string[]}
 */
function prepareSkills(data = {}) {
	let values = data?.value ?? [];

	if (values instanceof Set) {
		values = Array.from(values);
	} else if (!Array.isArray(values)) {
		values = values ? [values] : [];
	}

	const labels = values.map(
		(key) =>
			CONFIG.TRESDETV?.pericias?.[key] ??
			CONFIG.tresdetv?.pericias?.[key] ??
			toTitle(String(key).replaceAll("_", " ")),
	);

	const custom = String(data?.custom ?? "")
		.split(/[,;]/)
		.map((value) => value.trim())
		.filter(Boolean);

	return [...labels, ...custom].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Enriquece e higieniza HTML de descrição.
 *
 * @param {Actor|Item} relativeTo Documento de referência.
 * @param {string} value Conteúdo original.
 * @returns {Promise<string>}
 */
async function enrichRichText(relativeTo, value) {
	if (!value) {
		return "";
	}

	try {
		const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(value, {
			async: true,

			secrets: relativeTo.isOwner,

			relativeTo,

			rollData: relativeTo.getRollData?.() ?? relativeTo.parent?.getRollData?.() ?? {},
		});

		return sanitizeRichHtml(enriched);
	} catch (error) {
		console.warn("3DeT Victory | Não foi possível enriquecer um texto para o PDF.", error);

		return sanitizeRichHtml(value);
	}
}

/**
 * Remove elementos interativos ou inseguros
 * do HTML exportado.
 *
 * @param {string} html HTML original.
 * @returns {string}
 */
function sanitizeRichHtml(html) {
	const template = document.createElement("template");

	template.innerHTML = String(html ?? "");

	template.content
		.querySelectorAll(
			[
				"script",
				"style",
				"iframe",
				"object",
				"embed",
				"button",
				"input",
				"select",
				"textarea",
				"video",
				"audio",
			].join(", "),
		)
		.forEach((element) => element.remove());

	for (const element of template.content.querySelectorAll("*")) {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();

			if (name.startsWith("on") || name === "style" || name === "contenteditable" || name.startsWith("data-")) {
				element.removeAttribute(attribute.name);
			}
		}

		if (element instanceof HTMLAnchorElement) {
			element.removeAttribute("href");

			element.removeAttribute("target");
		}
	}

	return template.innerHTML;
}

/**
 * Documento temporário exibido durante
 * a preparação da exportação.
 *
 * @param {string} name Nome do documento.
 * @returns {string}
 */
function createLoadingDocument(name) {
	return `
		<!doctype html>

		<html lang="pt-BR">
			<head>
				<meta charset="utf-8">

				<title>
					Preparando
					${escapeHtml(name)}
				</title>

				<style>
					body {
						display: grid;
						place-items: center;

						min-height: 100vh;

						margin: 0;

						font-family:
							Arial,
							sans-serif;

						background: #17171d;
						color: #fff;
					}

					div {
						padding: 28px 34px;

						border-top:
							5px solid
							#f6a800;

						background: #24242b;

						box-shadow:
							0 12px 35px
							rgba(
								0,
								0,
								0,
								0.3
							);
					}
				</style>
			</head>

			<body>
				<div>
					Preparando a exportação de

					<strong>
						${escapeHtml(name)}
					</strong>...
				</div>
			</body>
		</html>
	`;
}

/**
 * Monta o documento HTML completo
 * para impressão.
 *
 * @param {string} title Título.
 * @param {string} body Corpo.
 * @returns {string}
 */
function createPrintableDocument(title, body) {
	return `
		<!doctype html>

		<html lang="pt-BR">
			<head>
				<meta charset="utf-8">

				<meta
					name="viewport"
					content="
						width=device-width,
						initial-scale=1
					"
				>

				<title>
					${escapeHtml(title)}
				</title>

				<style>
					${PRINT_STYLES}
				</style>
			</head>

			<body>
				${body}
			</body>
		</html>
	`;
}

/**
 * Aguarda imagens e fontes da janela.
 *
 * @param {Window} printWindow Janela.
 * @returns {Promise<void>}
 */
async function waitForPrintAssets(printWindow) {
	const images = Array.from(printWindow.document.images);

	await Promise.all(
		images.map((image) => {
			if (image.complete) {
				return Promise.resolve();
			}

			return new Promise((resolve) => {
				image.addEventListener("load", resolve, {
					once: true,
				});

				image.addEventListener("error", resolve, {
					once: true,
				});
			});
		}),
	);

	if (printWindow.document.fonts?.ready) {
		await printWindow.document.fonts.ready;
	}
}

/**
 * Formata a duração de uma Técnica.
 *
 * @param {object} duration Duração.
 * @returns {string}
 */
function formatDuration(duration = {}) {
	if (duration.especial) {
		return String(duration.especial);
	}

	const parts = [duration.value, duration.unidade]
		.filter((value) => value !== undefined && value !== null && value !== "")
		.map(String);

	return parts.length ? parts.join(" ") : "-";
}

/**
 * Retorna o nome de um atributo.
 *
 * @param {string} key Chave.
 * @returns {string}
 */
function getAttributeLabel(key) {
	if (!key) {
		return "-";
	}

	return CONFIG.TRESDETV?.atributos?.[key] ?? CONFIG.tresdetv?.atributos?.[key] ?? toTitle(String(key));
}

/**
 * Formata valores vazios.
 *
 * @param {unknown} value Valor.
 * @returns {string}
 */
function formatValue(value) {
	if (value === undefined || value === null || value === "") {
		return "-";
	}

	if (typeof value === "boolean") {
		return value ? "Sim" : "Não";
	}

	return String(value);
}

/**
 * Rótulo do tipo de Actor.
 *
 * @param {string} type Tipo.
 * @returns {string}
 */
function getActorTypeLabel(type) {
	return (
		{
			personagem: "Personagem",
			pdm: "PDM",
			veiculo: "Veículo",
		}[type] ?? toTitle(type ?? "Actor")
	);
}

/**
 * Rótulo do tipo de Item.
 *
 * @param {string} type Tipo.
 * @returns {string}
 */
function getItemTypeLabel(type) {
	return (
		{
			item: "Item",
			vantagem: "Vantagem",
			desvantagem: "Desvantagem",
			tecnica: "Técnica",
		}[type] ?? toTitle(type ?? "Item")
	);
}

/**
 * Converte texto para Title Case simples.
 *
 * @param {string} value Texto.
 * @returns {string}
 */
function toTitle(value) {
	return String(value ?? "")
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
		.join(" ");
}

/**
 * Escapa texto para HTML.
 *
 * @param {unknown} value Valor.
 * @returns {string}
 */
function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

/**
 * Escapa valor de atributo HTML.
 *
 * @param {unknown} value Valor.
 * @returns {string}
 */
function escapeAttribute(value) {
	return escapeHtml(value).replaceAll("`", "&#096;");
}

/**
 * Aguarda uma quantidade de milissegundos.
 *
 * @param {number} milliseconds Tempo.
 * @returns {Promise<void>}
 */
function wait(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const PRINT_STYLES = `
	@page {
		size: A4 portrait;
		margin: 10mm;
	}

	:root {
		--orange: #f6a800;
		--orange-dark: #cf7d00;
		--yellow: #ffc928;

		--ink: #17171d;
		--ink-soft: #34343c;

		--paper: #fffdf8;
		--paper-deep: #f1eadc;

		--line: #cfc5b4;
		--muted: #6f675c;

		--power: #c94f35;
		--skill: #347aaa;
		--resistance: #3e8659;

		--danger: #a83c38;
	}

	* {
		box-sizing: border-box;
	}

	html,
	body {
		margin: 0;
		padding: 0;

		background: #fff;
		color: var(--ink);

		font-family:
			"Segoe UI",
			Arial,
			sans-serif;

		font-size: 10pt;
		line-height: 1.42;

		-webkit-print-color-adjust:
			exact !important;

		print-color-adjust:
			exact !important;
	}

	.print-document {
		width: 100%;
		max-width: 190mm;

		margin: 0 auto;
	}

	.document-header {
		margin-bottom: 7mm;

		break-inside: avoid;
	}

	.brand-row {
		display: grid;

		grid-template-columns:
			34mm
			minmax(0, 1fr);

		align-items: stretch;

		gap: 4mm;

		margin-bottom: 4mm;
	}

	.brand-mark {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		min-height: 14mm;

		border-bottom:
			1.2mm solid
			var(--orange);

		font-style: italic;
		line-height: 0.85;
	}

	.brand-mark strong {
		font-family:
			Impact,
			"Arial Black",
			sans-serif;

		font-size: 20pt;
		letter-spacing: -0.8pt;
	}

	.brand-mark span {
		margin-top: 1.5mm;

		font-size: 7pt;
		font-weight: 900;
		letter-spacing: 1pt;

		text-transform: uppercase;

		color:
			var(--orange-dark);
	}

	.document-kind {
		display: flex;
		align-items: center;

		min-width: 0;

		padding:
			2.5mm 5mm;

		border-bottom:
			1.2mm solid
			var(--ink);

		background:
			var(--orange);

		font-family:
			Impact,
			"Arial Black",
			sans-serif;

		font-size: 17pt;
		letter-spacing: 0.3pt;

		text-transform: uppercase;

		clip-path:
			polygon(
				4mm 0,
				100% 0,
				100% 100%,
				0 100%,
				0 4mm
			);
	}

	.identity-grid {
		display: grid;

		grid-template-columns:
			38mm
			minmax(0, 1fr);

		gap: 5mm;

		align-items: stretch;
	}

	.item-identity-grid {
		grid-template-columns:
			34mm
			minmax(0, 1fr);
	}

	.portrait-frame {
		width: 100%;
		min-height: 38mm;

		padding: 1.2mm;

		border:
			0.7mm solid
			var(--orange);

		box-shadow:
			inset 0 0 0
			0.45mm
			var(--ink);

		background: #fff;

		clip-path:
			polygon(
				0 0,
				100% 0,
				100%
				calc(100% - 4mm),
				calc(100% - 4mm)
				100%,
				0 100%
			);
	}

	.portrait-frame img {
		display: block;

		width: 100%;
		height: 100%;

		min-height: 34mm;
		max-height: 52mm;

		object-fit: cover;
		object-position: center;
	}

	.portrait-placeholder {
		display: grid;
		place-items: center;

		color: var(--muted);

		font-size: 8pt;
		font-style: italic;
	}

	.identity-content {
		display: flex;
		flex-direction: column;
		justify-content: center;

		min-width: 0;
	}

	.eyebrow {
		margin:
			0 0 1mm;

		font-size: 7pt;
		font-weight: 900;
		letter-spacing: 1pt;

		text-transform: uppercase;

		color:
			var(--orange-dark);
	}

	h1 {
		margin:
			0 0 3mm;

		padding-bottom: 1.5mm;

		border-bottom:
			0.7mm solid
			var(--orange);

		font-family:
			Impact,
			"Arial Black",
			sans-serif;

		font-size: 24pt;
		line-height: 1;
		letter-spacing: 0.2pt;

		text-transform: uppercase;
	}

	.parent-document {
		margin:
			-1mm 0 3mm;

		color: var(--muted);

		font-size: 8pt;
	}

	.identity-fields {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0, 1fr)
			);

		gap:
			2.5mm 4mm;
	}

	.identity-field,
	.metadata-card {
		display: flex;
		flex-direction: column;

		min-width: 0;

		padding:
			2mm 2.5mm;

		border-left:
			1mm solid
			var(--orange);

		background:
			var(--paper-deep);
	}

	.identity-field span,
	.metadata-card span {
		font-size: 6.5pt;
		font-weight: 900;
		letter-spacing: 0.55pt;

		text-transform: uppercase;

		color: var(--muted);
	}

	.identity-field strong,
	.metadata-card strong {
		margin-top: 0.7mm;

		font-size: 10pt;

		word-break: break-word;
	}

	.summary-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0, 1fr)
			);

		gap: 5mm;

		margin-bottom: 5mm;

		break-inside: avoid;
	}

	.panel,
	.content-section {
		margin:
			0 0 5mm;

		border:
			0.35mm solid
			var(--line);

		border-top:
			1.2mm solid
			var(--orange);

		background:
			var(--paper);

		box-shadow:
			1.5mm 1.5mm 0
			rgba(
				23,
				23,
				29,
				0.05
			);
	}

	.content-section {
		break-inside: auto;
	}

	.compact-section,
	.metadata-section {
		break-inside: avoid;
	}

	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 4mm;

		min-height: 10mm;

		padding:
			2mm 3mm;

		border-bottom:
			0.55mm solid
			var(--orange);

		background:
			var(--ink);

		color: #fff;
	}

	.section-heading h2 {
		margin: 0;

		font-family:
			Impact,
			"Arial Black",
			sans-serif;

		font-size: 13pt;
		line-height: 1;
		letter-spacing: 0.35pt;

		text-transform: uppercase;
	}

	.section-heading span {
		font-size: 7pt;
		font-weight: 800;

		color: #f7e7bd;
	}

	.attribute-list,
	.resource-list {
		display: grid;
		gap: 0;
	}

	.attribute-row,
	.resource-row {
		display: grid;
		align-items: center;

		min-height: 13mm;

		padding:
			2mm 3mm;

		border-bottom:
			0.3mm solid
			var(--line);
	}

	.attribute-row:last-child,
	.resource-row:last-child {
		border-bottom: 0;
	}

	.attribute-row {
		grid-template-columns:
			9mm
			minmax(0, 1fr)
			10mm;

		gap: 2mm;

		border-left:
			1.2mm solid
			var(--orange);
	}

	.attribute-power {
		border-left-color:
			var(--power);
	}

	.attribute-skill {
		border-left-color:
			var(--skill);
	}

	.attribute-resistance {
		border-left-color:
			var(--resistance);
	}

	.attribute-letter {
		display: grid;
		place-items: center;

		width: 8mm;
		height: 8mm;

		border-radius: 1mm;

		background:
			var(--orange);

		color: #fff;

		font-size: 12pt;
		font-weight: 900;
	}

	.attribute-power
		.attribute-letter {
		background:
			var(--power);
	}

	.attribute-skill
		.attribute-letter {
		background:
			var(--skill);
	}

	.attribute-resistance
		.attribute-letter {
		background:
			var(--resistance);
	}

	.attribute-name {
		font-weight: 800;
	}

	.attribute-value {
		display: grid;
		place-items: center;

		width: 9mm;
		height: 9mm;

		border:
			0.55mm solid
			currentColor;

		border-radius: 1mm;

		font-size: 13pt;
	}

	.resource-row {
		grid-template-columns:
			minmax(0, 1fr)
			auto;

		gap: 3mm;
	}

	.resource-row > div {
		display: flex;
		flex-direction: column;
	}

	.resource-row > div strong {
		font-size: 11pt;

		color:
			var(--orange-dark);
	}

	.resource-row > div span {
		font-size: 7pt;

		color: var(--muted);
	}

	.resource-row p {
		display: flex;
		align-items: center;

		gap: 2mm;

		margin: 0;
	}

	.resource-row p b {
		display: grid;
		place-items: center;

		min-width: 9mm;
		height: 9mm;

		padding:
			0 1mm;

		border:
			0.4mm solid
			var(--line);

		border-radius: 1mm;

		background: #fff;
	}

	.resource-action {
		background: #f9e7e2;
	}

	.resource-mana {
		background: #e5f0f7;
	}

	.resource-life {
		background: #e4f1e8;
	}

	.resource-action
		> div strong {
		color: var(--power);
	}

	.resource-mana
		> div strong {
		color: var(--skill);
	}

	.resource-life
		> div strong {
		color: var(--resistance);
	}

	.chip-list {
		display: flex;
		flex-wrap: wrap;

		gap: 2mm;

		padding: 3mm;
	}

	.chip {
		display: inline-flex;
		align-items: center;

		min-height: 7mm;

		padding:
			1.2mm 2.5mm;

		border:
			0.35mm solid
			var(--orange-dark);

		border-radius: 4mm;

		background: #fff3cb;

		font-size: 8pt;
		font-weight: 800;
	}

	.group-block {
		margin: 3mm;

		border:
			0.3mm solid
			var(--line);

		break-inside: auto;
	}

	.group-title {
		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 3mm;

		min-height: 8mm;

		padding:
			1.5mm 2.5mm;

		border-left:
			1.2mm solid
			var(--orange);

		background:
			var(--paper-deep);

		font-size: 8pt;
		letter-spacing: 0.35pt;

		text-transform: uppercase;
	}

	.group-title > span {
		display: grid;
		place-items: center;

		min-width: 6mm;
		height: 6mm;

		border-radius: 3mm;

		background:
			var(--ink);

		color:
			var(--yellow);

		font-weight: 900;
	}

	.tier-truque
		.group-title {
		border-left-color: #7d5bb3;
		background: #eee7f8;
	}

	.tier-comum
		.group-title {
		border-left-color: #2f78ad;
		background: #e1edf6;
	}

	.tier-lendaria {
		border-color: #d99a14;

		background:
			linear-gradient(
				120deg,
				#fff9e4,
				#fff0a9 45%,
				#fffdf4
			);
	}

	.tier-lendaria
		.group-title {
		border-left-color: #d99a14;

		background:
			linear-gradient(
				100deg,
				#fff0a8,
				#fff8d8,
				#ffd766
			);
	}

	.tier-symbol {
		margin-right: 1mm;

		color:
			var(--orange-dark);
	}

	.entry-list {
		display: grid;
		gap: 0;
	}

	.entry {
		padding:
			2.5mm 3mm;

		border-bottom:
			0.3mm solid
			var(--line);

		break-inside: avoid;
	}

	.entry:last-child {
		border-bottom: 0;
	}

	.entry.has-description {
		break-inside: auto;
	}

	.entry-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: 3mm;
	}

	.entry-heading strong {
		font-size: 9.5pt;
	}

	.entry-badge {
		flex: 0 0 auto;

		padding:
			1mm 2mm;

		border-radius: 1mm;

		background:
			var(--orange);

		font-size: 7pt;
		font-weight: 900;
	}

	.disadvantage-entry
		.entry-badge {
		background:
			var(--danger);

		color: #fff;
	}

	.legendary-entry
		.entry-badge {
		background:
			linear-gradient(
				100deg,
				#8f5c00,
				#e5a91e,
				#fff0a2
			);

		color: #241500;
	}

	.entry-meta {
		margin:
			1.2mm 0 0;

		font-size: 7.5pt;
		font-weight: 700;

		color: var(--muted);
	}

	.entry-description,
	.rich-text {
		margin-top: 2mm;

		font-family:
			Arial,
			sans-serif;

		font-size: 8.5pt;
		line-height: 1.48;

		color:
			var(--ink-soft);
	}

	.rich-text {
		margin: 0;

		padding:
			3mm 4mm 4mm;
	}

	.entry-description p,
	.rich-text p {
		margin:
			0 0 2mm;
	}

	.entry-description p:last-child,
	.rich-text p:last-child {
		margin-bottom: 0;
	}

	.entry-description ul,
	.entry-description ol,
	.rich-text ul,
	.rich-text ol {
		margin:
			1mm 0 2mm 5mm;

		padding-left: 4mm;
	}

	.entry-description table,
	.rich-text table {
		width: 100%;

		border-collapse: collapse;

		font-size: 8pt;
	}

	.entry-description th,
	.entry-description td,
	.rich-text th,
	.rich-text td {
		padding: 1.2mm;

		border:
			0.25mm solid
			var(--line);
	}

	.metadata-grid {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0, 1fr)
			);

		gap: 3mm;

		padding: 3mm;
	}

	.effects-table {
		padding: 3mm;
	}

	.effects-table-header,
	.effects-table-row {
		display: grid;

		grid-template-columns:
			minmax(0, 1.2fr)
			minmax(24mm, 0.8fr)
			minmax(24mm, 0.7fr)
			18mm;

		gap: 2mm;

		align-items: center;

		padding:
			1.8mm 2mm;
	}

	.effects-table-header {
		background:
			var(--ink);

		color: #fff;

		font-size: 7pt;
		font-weight: 900;
		letter-spacing: 0.35pt;

		text-transform: uppercase;
	}

	.effects-table-row {
		border-bottom:
			0.3mm solid
			var(--line);

		font-size: 8pt;

		break-inside: avoid;
	}

	.effect-state {
		display: inline-grid;
		place-items: center;

		min-height: 6mm;

		border-radius: 3mm;

		font-size: 6.5pt;
		font-weight: 900;
	}

	.effect-state.active {
		background: #dff0e4;
		color: #286642;
	}

	.effect-state.disabled {
		background: #ece8e1;
		color: #71695e;
	}

	.empty-state,
	.empty-text {
		margin: 0;

		padding: 4mm;

		font-size: 8pt;
		font-style: italic;

		color: var(--muted);
	}

	.document-footer {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0, 1fr)
			);

		gap: 3mm;

		margin-top: 7mm;

		padding-top: 2mm;

		border-top:
			0.55mm solid
			var(--orange);

		font-size: 6.5pt;

		color: var(--muted);

		break-inside: avoid;
	}

	.document-footer
		span:nth-child(2) {
		text-align: center;
	}

	.document-footer
		span:last-child {
		text-align: right;

		word-break: break-all;
	}

	@media screen {
		body {
			padding: 24px;

			background: #313138;
		}

		.print-document {
			padding: 10mm;

			background: #fff;

			box-shadow:
				0 18px 60px
				rgba(
					0,
					0,
					0,
					0.35
				);
		}
	}

	@media print {
		html,
		body {
			width: auto;

			background: #fff;
		}

		.print-document {
			max-width: none;
		}
	}

	@media (max-width: 760px) {
		.identity-grid,
		.summary-grid,
		.metadata-grid {
			grid-template-columns: 1fr;
		}

		.portrait-frame {
			max-width: 48mm;
		}
	}
`;
