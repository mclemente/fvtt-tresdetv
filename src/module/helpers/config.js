import { preLocalize } from "../helpers/utils.js";

export const TRESDETV = {};

TRESDETV.armorTypes = {
	light: "tresdetv.Armor.Light",
	medium: "tresdetv.Armor.Medium",
	heavy: "tresdetv.Armor.Heavy",
	shield: "tresdetv.Armor.Shield",
};
preLocalize("armorTypes");

TRESDETV.weaponTypes = {
	light: "tresdetv.Weapon.Light",
	medium: "tresdetv.Weapon.Medium",
	heavy: "tresdetv.Weapon.Heavy",
};
preLocalize("weaponTypes");

TRESDETV.atributos = {
	str: {
		label: "Strength",
	},
};
preLocalize("atributos", { keys: ["label"] });
