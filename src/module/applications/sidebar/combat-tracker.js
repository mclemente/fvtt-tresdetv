export default class CombatTrackerTresDeTV extends foundry.applications.sidebar.tabs.CombatTracker {
	async _onCombatantControl(event, target) {
		const btn = target || event.currentTarget;
		const combatantId = btn.closest(".combatant").dataset.combatantId;
		const combatant = this.viewed.combatants.get(combatantId);
		const action = btn.dataset.control || btn.dataset.action;
		if (action === "rollInitiative" && combatant?.actor) return combatant.actor.rollInitiativeDialog();
		return super._onCombatantControl(event);
	}
}
