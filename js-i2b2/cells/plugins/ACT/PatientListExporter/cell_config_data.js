// this file contains a list of all files that need to be loaded dynamically for this i2b2 Cell
// every file in this list will be loaded after the cell's Init function is called
{
	files:[
		"PatientListExporter_ctrlr.js",
		"jquery.fileDownload.js",
		"jquery-confirm.min.js"
	],
	css:[ 
		"vwPatientListExporter.css",
		"style.min.css",
		"jquery-confirm.min.css"
	],
	config: {
		// additional configuration variables that are set by the system
		short_name: "Patient List Exporter",
		name: "Patient List Exporter",
	    icons: {size32x32: "table.png"},
		description: "This plugin enables the exporting of a list of i2b2 patient numbers from a workplace folder or from a previous query.",
		category: ["ACT"],
		plugin: {
			isolateHtml: false,  // this means do not use an IFRAME
			isolateComm: false,  // this means to expect the plugin to use AJAX communications provided by the framework
			standardTabs: true,  // this means the plugin uses standard tabs at top
			html: {
				source: 'injected_screens.html',
				mainDivId: 'PatientListExporter-mainDiv'
			}
		}
	}
}