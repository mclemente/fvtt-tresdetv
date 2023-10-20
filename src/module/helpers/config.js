const TRESDETV = {};

TRESDETV.atributos = {
	poder: "Poder",
	habilidade: "Habilidade",
	resistencia: "Resistência",
};

TRESDETV.traits = {
	pericia: {
		actorKeyPath: "pericias",
		configKey: "pericias",
		label: "Perícias",
		sortCategories: true,
	},
};

TRESDETV.tokenHPColors = {
	damage: 16711680,
	healing: 65280,
	temp: 6737151,
	tempmax: 4456550,
	negmax: 5570560,
};

export default TRESDETV;
