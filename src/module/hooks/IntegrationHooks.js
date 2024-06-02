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

	static async "item-piles-ready"() {
		game.itempiles.API.addSystemIntegration({
			VERSION: "1.0.0",
			ACTOR_CLASS_TYPE: "personagem",
			ITEM_CLASS_LOOT_TYPE: "item",
			ITEM_QUANTITY_ATTRIBUTE: "system.quantidade",
			ITEM_PRICE_ATTRIBUTE: "system.valor",
			ITEM_FILTERS: [
				{
					path: "type",
					filters: "tecnica,vantagem,desvantagem",
				},
			],
			UNSTACKABLE_ITEM_TYPES: ["tecnica", "vantagem", "desvantagem"],
			ITEM_SIMILARITIES: ["name", "type"],
			CURRENCIES: [
				{
					type: "item",
					name: "Moedas",
					img: "icons/commodities/currency/coin-plain-gold.webp",
					abbreviation: "{#}M",
					data: {
						item: {
							name: "Moedas",
							type: "item",
							img: "icons/commodities/currency/coin-plain-gold.webp",
							system: {
								quantidade: 1,
								valor: 1,
							},
						},
					},
					primary: true,
					exchangeRate: 1,
				},
			],
		});
	}
}
