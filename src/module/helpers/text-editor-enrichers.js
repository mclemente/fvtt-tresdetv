export function setTextEnrichers() {
	CONFIG.TextEditor.enrichers.push({
		pattern: /\[\[\/(r(?:oll)?a(?:tr)?) ([a-zA-Z0-9_@=\- ]+)\]\](?:{([^}]+)})?/gi,
		enricher: createRollAtr,
	});

	// activate listeners
	const body = $("body");
	body.on("click", "a.tresdetv-inline-roll", inlineRollOnClick);
}

function createRollAtr(match, options) {
	const mode = "roll";
	const extras = match[2].split(" ");
	const atr = extras.shift().trim();
	const args = { atr };
	for (let extra of extras) {
		const [key, value] = extra.split("=");
		if (!value) {
			args[key] = true;
		} else {
			args[key] = Number(value);
		}
	}
	// const atr = match[2];
	const flavor = match[3];
	const label = CONFIG.TRESDETV.atributos[atr]?.label ?? atr;
	const title = `Teste de ${label.capitalize()}`;

	return createButton(mode, "atr", args, flavor, title);
}

function createButton(mode, func, commandArgs, flavor, title) {
	const a = document.createElement("a");
	// add classes
	a.classList.add("tresdetv-inline-roll", mode);
	// add dataset
	a.dataset.mode = mode;
	a.dataset.func = func;
	a.dataset.flavor = flavor ?? "";
	for (const [k, v] of Object.entries(commandArgs)) {
		a.dataset[k] = v;
	}
	// the text inside
	a.innerHTML = `<i class="fas fa-dice-d6"></i> ${flavor ?? title}`;
	return a;
}

async function inlineRollOnClick(event) {
	event.preventDefault();
	const a = event.currentTarget;

	// Get the tokens to roll with (like the Saving Throw button)
	const tokens = tresdetv.documents.ItemTresDeTV._getChatCardTargets();
	// get the rollMode, leave undefined for roll so the chat log setting is used
	const rollMode = a.dataset.mode === "roll" ? undefined : a.dataset.mode;

	const flavor = a.dataset.flavor;
	const bonus = a.dataset.bonus ?? 0;
	const maestria = a.dataset.maestria;

	switch (a.dataset.func) {
		case "atr":
			for (const token of tokens) {
				const speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token.document });
				await token.actor.rollTest(a.dataset.atr, event, { flavor, rollMode, speaker, bonus, maestria });
			}
			break;
	}
}
