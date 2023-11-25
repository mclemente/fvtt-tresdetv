// SPDX-FileCopyrightText: 2022 Johannes Loher
//
// SPDX-License-Identifier: MIT

export default function registerSettings() {
	// Register any custom system settings here
	game.settings.register("tresdetv", "systemMigrationVersion", {
		name: "System Migration Version",
		scope: "world",
		config: false,
		type: String,
		default: "",
	});

	game.settings.register("tresdetv", "initiativeTiebreaker", {
		name: "TRESDETV.Settings.initiativeTiebreaker.name",
		hint: "TRESDETV.Settings.initiativeTiebreaker.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	game.settings.register("tresdetv", "pericias", {
		name: "TRESDETV.Settings.pericias.name",
		hint: "TRESDETV.Settings.pericias.hint",
		scope: "world",
		config: true,
		default:
			"Animais, Arte, Esporte, Influência, Luta, Manha, Máquinas, Medicina, Mística, Percepção, Saber, Sustento",
		type: String,
		onChange: () => {
			tresdetv.utils.getSkills();
		},
	});

	// Collapse Item Cards (by default)
	game.settings.register("tresdetv", "autoCollapseItemCards", {
		name: "TRESDETV.Settings.AutoCollapseCard.name",
		hint: "TRESDETV.Settings.AutoCollapseCard.hint",
		scope: "client",
		config: true,
		default: false,
		type: Boolean,
	});
}
