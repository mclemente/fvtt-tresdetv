/* eslint-disable no-undef */
export default class RollTresDeTV extends Roll {
	static EVALUATION_TEMPLATE = "systems/tresdetv/templates/apps/roll-dialog.hbs";

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
			if (term instanceof Die && this.data.atr) {
				const crits = term.values.filter((v) => v === term.faces).length;
				if (crits) {
					const formula = "+@atr".repeat(crits);
					this.terms = this.terms.concat(this.constructor.parse(formula, this.data));
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
	async configureDialog({ title, template } = {}, options = {}) {
		// Render the Dialog inner HTML
		const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {});

		// Create the Dialog window and await submission of the form
		return new Promise((resolve) => {
			new Dialog(
				{
					title,
					content,
					buttons: {
						um: {
							icon: '<i class="fas fa-dice"></i>',
							label: "1D",
							callback: (html) => resolve(this._onDialogSubmit(html, 1)),
						},
						dois: {
							icon: '<i class="fas fa-dice"></i>',
							label: "2D",
							callback: (html) => resolve(this._onDialogSubmit(html, 2)),
						},
						tres: {
							icon: '<i class="fas fa-dice"></i>',
							label: "3D",
							callback: (html) => resolve(this._onDialogSubmit(html, 3)),
						},
					},
					default: "dois",
					close: () => resolve(null),
				},
				options,
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
		// const form = html[0].querySelector("form");

		// Apply advantage or disadvantage
		this.terms[0].number = dice;
		return this;
	}
}
