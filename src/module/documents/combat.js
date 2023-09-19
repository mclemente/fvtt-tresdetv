export default class CombatTresDeTV extends Combat {
	//TODO add rollInitiative
	//TODO add a RollDialog when rolling initiative for a single character
	//TODO add a field to define initiative for NPCs

	_sortCombatants(a, b) {
		const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
		const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
		const atrA = a.token.actor.system.atributos.habilidade.value;
		const atrB = b.token.actor.system.atributos.habilidade.value;
		return ib - ia || atrA > atrB ? -1 : 1 || (a.id > b.id ? 1 : -1);
	}
}
