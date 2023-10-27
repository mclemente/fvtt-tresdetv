export default class IntegrationHooks {
	// Dice Tray module
	static "dice-calculator.keymaps"(diceMaps, Template) {
		class TresDeTV extends Template {
			get dice() {
				return [
					{
						d6: { label: "1D" },
						"2d6": { label: "2D" },
						"3d6": { label: "3D" },
					},
				];
			}

			// TODO override updateChatDice to change flag_button
		}
		diceMaps.tresdetv = TresDeTV;
	}
}
