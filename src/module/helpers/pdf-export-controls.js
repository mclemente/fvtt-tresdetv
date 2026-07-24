import { exportDocumentToPdf } from "./pdf-exporter.js";

let installed = false;

/**
 * Adiciona "Exportar para PDF" ao menu de
 * cabeçalho das fichas ApplicationV2.
 *
 * Funciona em fichas de Actor e Item.
 *
 * @returns {void}
 */
export function installPdfExportControls() {
	if (installed) {
		return;
	}

	installed = true;

	Hooks.on(
		"getHeaderControlsApplicationV2",

		(application, controls) => {
			const document = getSheetDocument(application);

			if (!document) {
				return;
			}

			if (document.documentName !== "Actor" && document.documentName !== "Item") {
				return;
			}

			const action = "exportTresDeTPdf";

			/*
			 * O hook pode ser disparado por
			 * classes diferentes da cadeia
			 * de herança.
			 *
			 * Esta verificação evita que a
			 * opção apareça duplicada.
			 */
			if (controls.some((control) => control.action === action)) {
				return;
			}

			const control = {
				label: "Exportar para PDF",

				icon: "fa-solid fa-file-pdf",

				action,

				classes: "tresdetv-export-pdf",

				onClick: () => exportDocumentToPdf(document),
			};

			/*
			 * Na ficha de personagem, posiciona
			 * a opção depois de Ajustes.
			 */
			const adjustmentsIndex = controls.findIndex((entry) => entry.action === "configureTresDeTVActor");

			if (adjustmentsIndex >= 0) {
				controls.splice(adjustmentsIndex + 1, 0, control);
			} else {
				controls.unshift(control);
			}
		},
	);
}

/**
 * Recupera o documento pertencente a uma ficha.
 *
 * @param {foundry.applications.api.ApplicationV2} application Aplicação.
 * @returns {Actor|Item|null}
 */
function getSheetDocument(application) {
	return application.document ?? application.actor ?? application.item ?? application.object ?? null;
}
