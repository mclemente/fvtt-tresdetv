/* eslint-disable no-undef */
export default class RollTresDeTV extends Roll {
	constructor(formula, data = {}, options = {}) {
		super(formula, data, options);
		this.critRange = 0;
		this.crits = true;
	}

	static EVALUATION_TEMPLATE = "systems/tresdetv/templates/chat/roll-dialog.hbs";

	async _evaluate({ minimize = false, maximize = false } = {}) {
		// Step 1 - Replace intermediate terms with evaluated numbers
		const intermediate = [];
		for (let term of this.terms) {
			if (!(term instanceof RollTerm)) {
				throw new Error("Roll evaluation encountered an invalid term which was not a RollTerm instance");
			}
			if (term.isIntermediate) {
				await term.evaluate({ minimize, maximize, async: true });
				this._dice = this._dice.concat(term.dice);
				term = new NumericTerm({ number: term.total, options: term.options });
			}
			intermediate.push(term);
		}
		this.terms = intermediate;

		// Step 2 - Simplify remaining terms
		this.terms = this.constructor.simplifyTerms(this.terms);

		// Step 3 - Evaluate remaining terms
		for (let term of this.terms) {
			if (!term._evaluated) await term.evaluate({ minimize, maximize, async: true });
			if (this.crits && term instanceof Die && this.data.atr) {
				const crits = term.values.filter((v) => v >= term.faces - this.critRange).length;
				if (crits) {
					const atrRoll = this.terms.find((t) => t instanceof NumericTerm);
					atrRoll.number *= 1 + crits;
					this._formula = this.resetFormula();
				}
			}
		}

		// Step 4 - Evaluate the final expression
		this._total = this._evaluateTotal();
		return this;
	}

	/* -------------------------------------------- */
	/*  Configuration Dialog                        */
	/* -------------------------------------------- */

	/**
	 * Create a Dialog prompt used to configure evaluation of an existing D20Roll instance.
	 * @param {object} data                     Dialog configuration data
	 * @param {string} [data.title]               The title of the shown dialog window
	 * @param {string} [data.template]            A custom path to an HTML template to use instead of the default
	 * @param {object} options                  Additional Dialog customization options
	 * @returns {Promise<D20Roll|null>}         A resulting D20Roll object constructed with the dialog, or null if the
	 *                                          dialog was closed
	 */
	async configureDialog(
		{
			title,
			template,
			actor,
			rollDice = false,
			bonus = 0,
			maestria = 6,
			semCrit = false,
			isInitiative = false,
		} = {},
		options = {},
	) {
		// Render the Dialog inner HTML
		// TODO adicionar lembrete das abilidades que podem afetar uma rolagem
		const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
			name: actor.isToken ? actor.parent.name : actor.name,
			img: actor.isToken ? actor.parent.texture.src : actor.img,
			isInitiative,
			bonus,
			maestria,
			semCrit,
		});

		// Create the Dialog window and await submission of the form
		return new Promise((resolve) => {
			new Dialog(
				{
					title,
					content,
					buttons: {
						um: {
							condition: !rollDice,
							icon: '<i class="fas fa-dice"></i>',
							label: "1D",
							callback: (html) => resolve(this._onDialogSubmit(html, 1)),
						},
						dois: {
							condition: !rollDice,
							icon: '<i class="fas fa-dice"></i>',
							label: "2D",
							callback: (html) => resolve(this._onDialogSubmit(html, 2)),
						},
						tres: {
							condition: !rollDice,
							icon: '<i class="fas fa-dice"></i>',
							label: "3D",
							callback: (html) => resolve(this._onDialogSubmit(html, 3)),
						},
						teste: {
							condition: rollDice,
							label: `Rolar ${rollDice}D`,
							callback: (html) => resolve(this._onDialogSubmit(html)),
						},
					},
					default: rollDice ? "teste" : "dois",
					close: () => resolve(null),
				},
				mergeObject({ width: 250 }, options),
			).render(true);
		});
	}

	/* -------------------------------------------- */

	/**
	 * Handle submission of the Roll evaluation configuration Dialog
	 * @param {jQuery} html            The submitted dialog content
	 * @param {number} dice   The chosen dice rolled
	 * @returns {D20Roll}              This damage roll.
	 * @private
	 */
	_onDialogSubmit(html, dice) {
		const form = html[0].querySelector("form");

		if (form.modificador.value && form.modificador.value !== "0") {
			const bonusPen = Number(form.modificador.value) > 0 ? "Bônus" : "Penalidade";
			const modificador = new Roll(`${form.modificador.value}[${bonusPen}]`, this.data);
			if (!(modificador.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({ operator: "+" }));
			this.terms = this.terms.concat(modificador.terms);
		}

		if (form.semCrit.checked) {
			this.crits = false;
		} else if (form.maestria.value !== 6) {
			this.critRange += 6 - form.maestria.value;
		}

		if (dice) this.terms[0].number = dice;
		this.resetFormula();
		return this;
	}
}
