export default class ActorTweaks extends DocumentSheet {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "actor-tweaks",
			classes: ["tresdetv", "actor-tweaks", "subconfig"],
			template: "systems/tresdetv/templates/apps/actor-tweaks.hbs",
			width: 320,
			height: "auto",
			sheetConfig: false,
		});
	}

	get id() {
		return `${this.constructor.name}-Tweaks-Actor-${this.document.id}`;
	}

	get title() {
		return `${this.document.name}: Ajustes`;
	}

	async getData() {
		const pontos = foundry.utils.getProperty(this.document, "system.pontos");
		if (!pontos) return super.getData();
		delete pontos.experiencia;
		delete pontos.personagem;

		return { pontos };
	}
}
