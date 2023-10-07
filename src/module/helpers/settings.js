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
}
