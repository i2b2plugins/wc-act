// this file contains a list of all files that need to be loaded dynamically for this i2b2 Cell
// every file in this list will be loaded after the cell's Init function is called
{
	files: [
		"PatientSetViewer_ctrlr.js",
		"workingFolder.js",
		"PatientSetViewer_modLabRange.js",
		"PatientSetViewer_dateConstraintDialog.js",
		"jquery-confirm.min.js",
		"jstree.min.js",
		"jquery-ui.min.js",
		"intro.js"
	],
		css:[
			"vwPatientSetViewer.css",
			"jquery-confirm.min.css",
			"style.min.css",
			"jquery-ui.min.css",
			"jquery-ui.structure.min.css",
			"jquery-ui.theme.min.css",
			"introjs.css"
		],
			config: {
		// additional configuration variables that are set by the system
	short_name: "Review Table of Patients",
	    name: "Review Table of Patients",
	    description: "This plugin enables the creation of a table of aggregated patient data for reviewing and downloading.",
	    icons: { size32x32: "patients.gif" },
	    category: ["ACT"],
	    plugin: {
			isolateHtml: false,  // this means do not use an IFRAME
				isolateComm: false,  // this means to expect the plugin to use AJAX communications provided by the framework
					standardTabs: true, // this means the plugin uses standard tabs at top
						html: {
				source: 'injected_screens.html',
					mainDivId: 'PatientSetViewer-mainDiv'
			}
		}
	}
}