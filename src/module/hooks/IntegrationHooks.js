export default class IntegrationHooks {
	// Dice Tray module
	static dcCalcWhitelist(whitelist, actor) {
		// Add whitelist support for the calculator.
		whitelist.tresdetv = {
			custom: {
				custom: {
					"1d6": {
						label: "1d6",
						name: "1D",
						formula: "1d6",
					},
					"2d6": {
						label: "2d6",
						name: "2D",
						formula: "2d6",
					},
					"3d6": {
						label: "3d6",
						name: "3D",
						formula: "3d6",
					},
				},
			},
		};

		// Add a custom row of buttons based on 13th Age's ability damage at high levels.
		for (let prop in actor.system.atributos) {
			whitelist.tresdetv.custom.custom[prop] = {
				label: prop,
				name: prop.capitalize(),
				formula: `@${prop}`,
			};
		}
	}
}
