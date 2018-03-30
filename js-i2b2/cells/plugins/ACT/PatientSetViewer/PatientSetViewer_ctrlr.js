/**
 * @project     Patient Set Viewer
 * @description JS Controller for Review Table of Patients Plugin
 * @inherits	i2b2
 * @namespace	i2b2.PatientSetViewer
 * @author	Nich Wattanasin
 * @author      David Wang
 * @author      Bhaswati Ghosh
 * @author      Jay Tarantino
 * @version 	March 23, 2018
 * Copyright (c) 2006-2018 Massachusetts General Hospital
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the i2b2 Software License v2.1
 * which accompanies this distribution.
 *
 * ----------------------------------------------------------------------------------------
 */

i2b2.PatientSetViewer.cellDataOption = {};
i2b2.PatientSetViewer.cellDataOption.DEFAULT = "Existence (Yes/No)";
i2b2.PatientSetViewer.cellDataOption.MIN = "Minimum Value";
i2b2.PatientSetViewer.cellDataOption.MAX = "Maximum Value";
i2b2.PatientSetViewer.cellDataOption.AVERAGE = "Average Value";
i2b2.PatientSetViewer.cellDataOption.MEDIAN = "Median Value";
i2b2.PatientSetViewer.cellDataOption.FIRST = "Date (First)";
i2b2.PatientSetViewer.cellDataOption.LAST = "Date (Most Recent)";
i2b2.PatientSetViewer.cellDataOption.COUNT = "Count";
i2b2.PatientSetViewer.cellDataOption.ALLVALUES = "List of All Values";
i2b2.PatientSetViewer.cellDataOption.MODE = "Mode (Most Frequent Value)";
i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT = "All Concepts (Names/Text)";
i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT = "Most Frequent Concept (Names/Text)";
i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE = "All Concepts (Codes)";
i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE = "Most Frequent Concept (Codes)";

i2b2.PatientSetViewer.numbersOnly = false;
i2b2.PatientSetViewer.previewRequested = false;
i2b2.PatientSetViewer.dataRequested = false;
i2b2.PatientSetViewer.queryMasterId = "";
i2b2.PatientSetViewer.downloadID = "";
i2b2.PatientSetViewer.lastDroppedTerm = null;
i2b2.PatientSetViewer.workingFolder = "";

jQuery(document).on("context_show.vakata", function (e, data) {
	data.element.css('top', jQuery('.jstree-clicked').offset().top + 20); // Firefox fix for postion of the context menu of the jstree
});

i2b2.PatientSetViewer.UI = {};

i2b2.PatientSetViewer.user = {};

i2b2.PatientSetViewer.viewResultsTableOption = false;

i2b2.PatientSetViewer.activePage = 1;

// Value types gathered from value metadata in concepts and modifiers. Used to differentiate different types of value restrictions. Combines posInteger, Integer, PosFloat, and Float as NUMERIC Data
i2b2.PatientSetViewer.valueType = {};
i2b2.PatientSetViewer.valueType.NUMERIC = { id: 1, text: "numeric" };       // NUMERIC_DATA: PosInteger, Integer, PosFloat, Float
i2b2.PatientSetViewer.valueType.ENUM = { id: 2, text: "enumerated" };    // ENUM
i2b2.PatientSetViewer.valueType.BLOB = { id: 3, text: "blob" };          // LARGESTRING (BLOB)
i2b2.PatientSetViewer.valueType.MIXED = { id: 4, text: "mixed" };         // This is used to describe a Group containing concepts of mixed value types
i2b2.PatientSetViewer.valueType.UNKNOWN = { id: 0, text: "unknown" };       // Unknown (sanity check)

var zygosityValues = ["Heterozygous", "Homozygous", "missing_zygosity"];
var consequenceValues = ["3'UTR", "5'UTR", "downstream", "exon", "Frameshift", "In-frame", "intron", "missense", "nonsense", "start_loss", "stop_loss", "synonymous", "upstream", "missing_consequence"];
var alleleValues = ["A_to_C", "A_to_G", "A_to_T", "C_to_A", "C_to_G", "C_to_T", "G_to_A", "G_to_C", "G_to_T", "T_to_A", "T_to_C", "T_to_G", "._."];

//Change BG for new value box architecture
i2b2.PatientSetViewer.currentTerm = null;

i2b2.PatientSetViewer.addOperationInitiated = [];

i2b2.PatientSetViewer.Init = function (loadedDiv) {

    //	i2b2.PatientSetViewer.Build();  /*Calls this workingFolder.js method to build the work place jstree so the user can select a working folder */

	jQuery("#subMenu").accordion({
		heightStyle: "content",
		collapsible: true,
		activate: function (event, ui) {
			if (ui.newPanel.index() === 7)
				i2b2.PatientSetViewer.processJob(1);
		}
	});

	// register DIV as valid DragDrop target for Patient Record Sets (PRS) objects
	var op_trgt = { dropTarget: true };
	var wrk_trgt = { dropTarget: true };

	i2b2.sdx.Master.AttachType("PatientSetViewer-CONCPTDROP", "CONCPT", op_trgt);
	i2b2.sdx.Master.AttachType("PatientSetViewer-CONCPTDROP", "QM", op_trgt);
	i2b2.sdx.Master.AttachType("PatientSetViewer-PRSDROP", "PRS", op_trgt);
	i2b2.sdx.Master.AttachType("PatientSetViewer-PRSDROP", "QM", op_trgt);
        i2b2.sdx.Master.AttachType("PatientSetViewer-WRKDROP", "WRK", wrk_trgt);

        i2b2.sdx.Master.setHandlerCustom("PatientSetViewer-WRKDROP", "WRK", "DropHandler", i2b2.PatientSetViewer.wrkDropped);
	// drop event handlers used by this plugin
	i2b2.sdx.Master.setHandlerCustom("PatientSetViewer-CONCPTDROP", "CONCPT", "DropHandler", i2b2.PatientSetViewer.conceptDropped);
	i2b2.sdx.Master.setHandlerCustom("PatientSetViewer-CONCPTDROP", "QM", "DropHandler", i2b2.PatientSetViewer.queryConceptDropped);
	i2b2.sdx.Master.setHandlerCustom("PatientSetViewer-PRSDROP", "PRS", "DropHandler", i2b2.PatientSetViewer.prsDropped);
	i2b2.sdx.Master.setHandlerCustom("PatientSetViewer-PRSDROP", "QM", "DropHandler", i2b2.PatientSetViewer.queryDropped);

	i2b2.PatientSetViewer.setWorkplaceRootIndex(i2b2.PM.model.login_username);

	i2b2.PatientSetViewer.active = new Object();

	i2b2.PatientSetViewer.model.prsRecord = false;
	i2b2.PatientSetViewer.model.conceptRecord = false;
	i2b2.PatientSetViewer.model.dirtyResultsData = true;

	i2b2.PatientSetViewer.columnDisplaySelectID = "columnDisplaySelectID";
	i2b2.PatientSetViewer.model.pageSize = 50;
	i2b2.PatientSetViewer.model.processed = 0;
	i2b2.PatientSetViewer.msgCounter = 0;
	// array to store concepts
	i2b2.PatientSetViewer.model.concepts = [];

	// set initial pagination values
	i2b2.PatientSetViewer.model.pgstart = 1;
	i2b2.PatientSetViewer.model.pgsize = 10;

	i2b2.PatientSetViewer.model.required = {
		'id': {
			'name': 'Patient Number',
			'display': true
		},
		'gender': {
			'name': 'Gender',
			'display': true
		},
		'age': {
			'name': 'Age',
			'display': true
		},
		'race': {
			'name': 'Race',
			'display': true
		}
	};

	i2b2.PatientSetViewer.model.showMetadataDialog = true;

	i2b2.PatientSetViewer.model.csv = '';

	i2b2.PatientSetViewer.model.firstVisit = true;
	i2b2.PatientSetViewer.model.readyToPreview = false;
	i2b2.PatientSetViewer.model.readyToProcess = false;
	i2b2.PatientSetViewer.model.processLocked = false;
	// manage YUI tabs
	this.yuiTabs = new YAHOO.widget.TabView("PatientSetViewer-TABS");

	this.yuiTabs.on('activeTabChange', function (ev) {
		//Tabs have changed 		
		if (ev.newValue.get('id') == "PatientSetViewer-TAB2") { // History Tab
			i2b2.PatientSetViewer.getHistory();
		}
	});
	z = $('anaPluginViewFrame').getHeight() - 40;//- 34;  //BG vertical scrollbar display issues

	i2b2.PatientSetViewer.workplaceCartIndex = null;
	
	i2b2.PatientSetViewer.conceptsRender();

	// Tutorial
	jQuery('#crcHistoryBox').attr("data-step","1").attr("data-intro","Start by dragging a Previous Query from here...");
	jQuery('#PatientSetViewer-patientsbar').attr("data-step","2").attr("data-intro","...and dropping the Previous Query in the Patient(s) bar.");
	jQuery('#PatientSetViewer-patientsonlybar').attr("data-step","3").attr("data-intro","Check this box if you are interested in only retrieving i2b2 Patient Numbers.");
        jQuery('#ontNavDisp').attr("data-step","4").attr("data-intro","Optionally, drag any additional terms to include in your table from here...");
        jQuery('#PatientSetViewer-conceptsbar').attr("data-step","5").attr("data-intro","...and drop them in the Concept(s) bar.");
	jQuery('#PatientSetViewer-CONCEPTS').attr("data-step","6").attr("data-intro","Each concept row here represents a column in your patient table. Select your desired Aggregate Option for the data in the column.");
	
	//Workplace popup
	jQuery('<div id="workAlert" style="position: absolute;width: 375px;height: 50px;z-index: 1000;right:' +
        ' 0px;margin-right: -375px;margin-top: 25px;text-align: center;display: none;border: 2px solid #5398fb;background:' +
        ' white;border-radius: 10px;"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/left.jpg" style="float: left;" />' +
        '<span id="workAlertSpan" style="position: relative;top: 10px;"></span></div>').prependTo('#wrkWorkplace');
};

i2b2.PatientSetViewer.loadSavedPatients = function () {
	var scopedCallbackCart = new i2b2_scopedCallback();
	scopedCallbackCart.scope = i2b2.WORK;
	scopedCallbackCart.callback = function (results) {
		var cartFound = false;
		var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");

		jQuery("[id^=save_]").prop('checked', false);  /* reset checkboxes */


		for (var i = 0; i < nlst.length; i++) {
			var s = nlst[i];
			var folder_name = i2b2.h.getXNodeVal(s, "name");
			var folder_type = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
			if (folder_type == 'PATIENT') {
				jQuery('#save_' + folder_name).prop('checked', true);
			}
		}
	};

	var varInput = {
		parent_key_value: i2b2.PatientSetViewer.workplaceCartIndex,
		result_wait_time: 180
	};
	i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);
};

// Saves or deletes Patient to or from the Working folder in user's workplace
i2b2.PatientSetViewer.savePatient = function (pat_num) {
    if(!i2b2.PatientSetViewer.workingFolder){
	jQuery.alert({
		boxWidth: '300px',
		useBootstrap: false,
		title: 'Please Note',
		content: 'You must first <strong>Designate a Workplace Folder</strong> to store this patient',
		buttons: {
		    'OK' : function(){
			jQuery("#subMenu").accordion({active: 2});
		    }
		}
	    });
	jQuery('#save_' + pat_num).attr('checked', false);

    } else {
	jQuery('#save_' + pat_num).prop('disabled', function (i, v) { return !v; });
	jQuery('#save_' + pat_num).after('<img id=\"Image_' + pat_num + '\" src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/spinning.gif\" align=\"absmiddle\" style=\"margin-left:5px;\"/>');
	jQuery('#save_' + pat_num).hide();

	i2b2.PatientSetViewer.saveDeletePatient(pat_num);
    }
};


i2b2.PatientSetViewer.loadDefinition = function (job_id) {
    jQuery.ajax({
	    type: 'POST',
	    url: "js-i2b2/cells/plugins/ACT/PatientSetViewer/load.php",
	    data: {
		job_id: job_id
	    },
	    success: function (definition) {
		i2b2.PatientSetViewer.model.concepts = JSON.parse(definition);
		i2b2.PatientSetViewer.conceptsRender();
		$('PatientSetViewer-TAB0').click();
		jQuery("#subMenu").accordion({active: 0});
	    },
	    error: function (history) {

	    }
        });
    return false;
};



// Saves or deletes Patient to or from the working folder in user's workplace
i2b2.PatientSetViewer.saveDeletePatient = function (pat_num) {	
    if(!'pat'+pat_num in i2b2.PatientSetViewer.addOperationInitiated){
	i2b2.PatientSetViewer.addOperationInitiated['pat'+pat_num] = false;
    }

	if (jQuery('#save_' + pat_num).prop('checked')) {
	    if(!i2b2.PatientSetViewer.addOperationInitiated['pat'+pat_num]){
			var scopedCallbackExistence = new i2b2_scopedCallback();
			scopedCallbackExistence.scope = i2b2.WORK;
			scopedCallbackExistence.callback = function (results) {
				var patAlreadyExists = false;
				var cartFound = false;
				var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
				for (var i = 0; i < nlst.length; i++) {
					var s = nlst[i];
					var folder_name = i2b2.h.getXNodeVal(s, "name");
					var folder_index = i2b2.h.getXNodeVal(s, "index");
					var folder_type = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
					if (folder_name == pat_num && folder_type == 'PATIENT') {
						patAlreadyExists = true;
						break;
					}
				}
				if (patAlreadyExists) {
					jQuery.alert({
						boxWidth: '300px',
						useBootstrap: false,
						type: 'orange',
						title: 'Please Wait',
						content: 'Selected patient already exists in the selected work folder. '
					});
					i2b2.PatientSetViewer.addOperationInitiated['pat'+pat_num] = false;

					return;
				}
				else {
					//Add Saved Patient
					var encapXML = "";
					var encapWorkType = "";
					var encapValues = {};
					var encapTitle = "";
					var encapNoEscape = [];

					encapXML = i2b2.WORK.cfg.msgs.encapsulatePR;
					encapWorkType = "PATIENT";
					encapValues.pr_id = pat_num;
					encapValues.pr_name = pat_num;
					encapValues.parent_prs_id = i2b2.PatientSetViewer.model.prsRecord.sdxInfo.sdxKeyValue;
					encapValues.parent_prs_name = '[PATIENTSET_' + encapValues.parent_prs_id + ']';
					encapTitle = encapValues.pr_name;
					// package the work_xml snippet
					i2b2.h.EscapeTemplateVars(encapValues, encapNoEscape);
					var syntax = /(^|.|\r|\n)(\{{{\s*(\w+)\s*}}})/;
					var t = new Template(encapXML, syntax);
					var encapMsg = t.evaluate(encapValues);

					// gather primary message info
					var newChildKey = i2b2.h.GenerateAlphaNumId(20);
					var varInput = {
						child_name: encapTitle,
						child_index: newChildKey,
						parent_key_value: i2b2.PatientSetViewer.workplaceCartIndex,
						share_id: 'N',
						child_visual_attributes: "ZA",
						child_annotation: i2b2.PatientSetViewer.PSVFolder,
						child_work_type: encapWorkType,
						child_work_xml: encapMsg,
						result_wait_time: 180
					};
					var scopedCallback = new i2b2_scopedCallback();
					scopedCallback.scope = i2b2.WORK;
					scopedCallback.callback = function (results) {
						if (results.error) {
							jQuery.alert({
								boxWidth: '300px',
								useBootstrap: false,
								type: 'red',
								title: 'Oh no!',
								content: 'An error occurred while trying to save patient in the selected folder!'
							});
						} else {
							i2b2.PatientSetViewer.refreshWorkspaceTree(i2b2.PatientSetViewer.workplaceCartIndex);
							jQuery.alert({
								boxWidth: '300px',
								autoClose: 'ok|3000',
								useBootstrap: false,
								title: 'Done!',
								content: 'Patient has been saved to your Workplace',

							});
						}
						i2b2.PatientSetViewer.addOperationInitiated['pat'+pat_num] = false;
						jQuery('#save_' + pat_num).prop('disabled', function (i, v) { return !v; });
						jQuery('#save_' + pat_num).show();
						jQuery('#Image_' + pat_num).remove();
					}
					i2b2.WORK.ajax.addChild("WORK:Workplace", varInput, scopedCallback);
				}
			};
			//Look for existence of the patient in parent folder
			var varInput = {
				parent_key_value: i2b2.PatientSetViewer.workplaceCartIndex,
				result_wait_time: 180
			};
			i2b2.PatientSetViewer.addOperationInitiated['pat'+pat_num] = true;

			i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackExistence);
		}
	}
	else {
		// Delete Saved Patient
		var scopedCallbackCart = new i2b2_scopedCallback();
		scopedCallbackCart.scope = i2b2.WORK;
		scopedCallbackCart.callback = function (results) {
			var cartFound = false;
			var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
			for (var i = 0; i < nlst.length; i++) {
				var s = nlst[i];
				var folder_name = i2b2.h.getXNodeVal(s, "name");
				var folder_index = i2b2.h.getXNodeVal(s, "index");
				var folder_type = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
				if (folder_name == pat_num && folder_type == 'PATIENT') {
					// delete child
					var scopedCallbackDelete = new i2b2_scopedCallback();
					scopedCallbackDelete.scope = i2b2.WORK;
					scopedCallbackDelete.callback = function (results) {
						if (results.error) {
							jQuery.alert({
								boxWidth: '300px',
								useBootstrap: false,
								type: 'red',
								title: 'Oh no!',
								content: 'An error occurred while trying to remove a patient form work item!'
							});
							//alert("An error occurred while trying to remove a patient form work item!");
						}
						else {
							i2b2.PatientSetViewer.refreshWorkspaceTree(i2b2.PatientSetViewer.workplaceCartIndex);
							jQuery.alert({
								boxWidth: '300px',
								useBootstrap: false,
								autoClose: 'ok|3000',
								title: 'Done!',
								content: 'Patient ' + pat_num + ' has been removed from your Workplace!',
								cancelAction: function () {
								}
							});
							//alert('Patient '+pat_num+' has been removed from your Workplace');
						}
						jQuery('#save_' + pat_num).prop('disabled', function (i, v) { return !v; });
						jQuery('#save_' + pat_num).show();
						jQuery('#Image_' + pat_num).remove();
					};
					var varInput = {
						delete_target_id: folder_index,
						result_wait_time: 180
					};
					i2b2.WORK.ajax.deleteChild("WORK:Workplace", varInput, scopedCallbackDelete);

					break;
				}
			}
		};

		var varInput = {
			parent_key_value: i2b2.PatientSetViewer.workplaceCartIndex,
			result_wait_time: 180
		};

		i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);
	}
};

i2b2.PatientSetViewer.refreshWorkspaceTree = function (nodeIndex) {
	try {
		var workTree = i2b2.WORK.view.main.yuiTree;
		var nodeOfInterest = null;
		workTree._nodes.each(function (nd) {
			if (nd.data.i2b2_SDX.sdxInfo.sdxKeyValue.indexOf(nodeIndex) >= 0) {
				nodeOfInterest = nd;
				throw $break;
			}
		});
		if (nodeOfInterest) {
			nodeOfInterest.collapse();
			nodeOfInterest.dynamicLoadComplete = false;
			nodeOfInterest.childrenRendered = false;
			nodeOfInterest.tree.removeChildren(nodeOfInterest);
			nodeOfInterest.expand();
		}

	}
	catch (e)
	{ }
};


i2b2.PatientSetViewer.checkWorkplaceCartIndex = function (pat_num, currentParrent, currentNode) {

	if (currentParrent) {
		i2b2.PatientSetViewer.workplaceRootIndex = currentParrent;
		i2b2.PatientSetViewer.workplaceCartIndex = currentNode;
	}
	else {
		i2b2.PatientSetViewer.workplaceCartIndex = null;
		var scopedCallbackCart = new i2b2_scopedCallback();
		scopedCallbackCart.scope = i2b2.WORK;
		scopedCallbackCart.callback = function (results) {
			var cartFound = false;
			var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
			for (var i = 0; i < nlst.length; i++) {
				var s = nlst[i];
				var folder_name = i2b2.h.getXNodeVal(s, "name");
				var folder_index = i2b2.h.getXNodeVal(s, "index");
				if (folder_name == i2b2.PatientSetViewer.workingFolder) {
					cartFound = true;
					i2b2.PatientSetViewer.workplaceCartIndex = folder_index;
					break;
				}
			}
			if (i2b2.PatientSetViewer.workplaceCartIndex)
				i2b2.PatientSetViewer.saveDeletePatient(pat_num);
		};

		var varInput = {
			parent_key_value: i2b2.PatientSetViewer.workplaceRootIndex,
			result_wait_time: 180
		};
		i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);
	}
};


i2b2.PatientSetViewer.setWorkplaceRootIndex = function (user_id) {
	var scopedCallback = new i2b2_scopedCallback();
	scopedCallback.scope = i2b2.WORK;
	scopedCallback.callback = function (results) {
		var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
		for (var i = 0; i < nlst.length; i++) {
			var s = nlst[i];
			var folder_user_id = i2b2.h.getXNodeVal(s, "user_id");
			var folder_index = i2b2.h.getXNodeVal(s, "index");
			if (folder_user_id == user_id) {
				i2b2.PatientSetViewer.workplaceRootIndex = folder_index;


				var scopedCallbackCart = new i2b2_scopedCallback();
				scopedCallbackCart.scope = i2b2.WORK;
				scopedCallbackCart.callback = function (results) {
					var cartFound = false;
					var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
					for (var i = 0; i < nlst.length; i++) {
						var s = nlst[i];
						var folder_name = i2b2.h.getXNodeVal(s, "name");
						var folder_index = i2b2.h.getXNodeVal(s, "index");
						if (folder_name == i2b2.PatientSetViewer.workingFolder) {
							cartFound = true;
							i2b2.PatientSetViewer.workplaceCartIndex = folder_index;
							break;
						}
					}

					i2b2.PatientSetViewer.refreshWorkspaceTree(i2b2.PatientSetViewer.workplaceRootIndex);
				};

				var varInput = {
					parent_key_value: i2b2.PatientSetViewer.workplaceRootIndex,
					result_wait_time: 180
				};
				i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);
				break;
			}
		}
	};

	if (i2b2.PM.model.userRoles.indexOf("MANAGER") == -1) {
		i2b2.WORK.ajax.getFoldersByUserId("WORK:Workplace", {}, scopedCallback);
	} else {
		i2b2.WORK.ajax.getFoldersByProject("WORK:Workplace", {}, scopedCallback);
	}

};


// 2.0: Download CSV for job_id
i2b2.PatientSetViewer.downloadJob = function (job_id) {

	jQuery('#downloadForm [name="user_id"]').val(i2b2.PM.model.login_username);
	jQuery('#downloadForm [name="session"]').val(i2b2.PM.model.login_password);
	jQuery('#downloadForm [name="job_id"]').val(job_id);
	jQuery('#downloadForm [name="pm_uri"]').val(i2b2.PM.cfg.cellURL);
	jQuery('#downloadForm [name="domain"]').val(i2b2.PM.model.login_domain);


	jQuery('#downloadForm').submit();

};

i2b2.PatientSetViewer.getNextJobPage = function () {
	i2b2.PatientSetViewer.activePage = i2b2.PatientSetViewer.activePage + 1;
	i2b2.PatientSetViewer.getJobPage(i2b2.PatientSetViewer.activeJobID, i2b2.PatientSetViewer.activePage);

};

i2b2.PatientSetViewer.getPrevJobPage = function () {
	i2b2.PatientSetViewer.activePage = i2b2.PatientSetViewer.activePage - 1;
	i2b2.PatientSetViewer.getJobPage(i2b2.PatientSetViewer.activeJobID, i2b2.PatientSetViewer.activePage);

};

i2b2.PatientSetViewer.getJobPage = function (job_id, page) {
	jQuery.post('js-i2b2/cells/plugins/ACT/PatientSetViewer/helper.php', {
		job_id: job_id,
		preview: page
	})
		.success(function (job_id) {
			i2b2.PatientSetViewer.previewResults(job_id);
		})
		.error(function () {
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				type: 'red',
				title: 'Oh no!',
				content: 'Preview Error!'
			});
			//alert('Preview Error');
		});



};


i2b2.PatientSetViewer.startDownload = function(){

    $('PatientSetViewer-TAB1').click();
    i2b2.PatientSetViewer.processJob(0);

};

// 2.0: User has selected previous query (patients) and concepts (aggregations)
i2b2.PatientSetViewer.processJob = function (preview) {

	var job = {};
	if (preview) {
	    if (i2b2.PatientSetViewer.model.dirtyResultsData && !i2b2.PatientSetViewer.model.previewLocked) {
		if (i2b2.PatientSetViewer.model.prsRecord) {
		    i2b2.PatientSetViewer.setLocalUniqueNumber();
		    job = {
			event_type_id: i2b2.PatientSetViewer.downloadID,
			query_master_id: i2b2.PatientSetViewer.queryMasterId,
			model: i2b2.PatientSetViewer.model,
			filterlist: i2b2.PatientSetViewer._getPDOFilterList(),
			patient_set_size: parseInt(i2b2.PatientSetViewer.active.size),
			patient_set_coll_id: i2b2.PatientSetViewer.model.prsRecord.sdxInfo.sdxKeyValue,
			domain: i2b2.PM.model.login_domain,
			userid: i2b2.PM.model.login_username,
			project: i2b2.PM.model.login_project,
			crc_uri: i2b2.CRC.cfg.cellURL,
			login_password: i2b2.PM.model.login_password,
			status: "NEW",
			payload: "New Job"
		    };
		    
		    jQuery.post('js-i2b2/cells/plugins/ACT/PatientSetViewer/helper.php', {
			    job: JSON.stringify(job),
				preview: 1
				})
			.success(function (job_id) {
				i2b2.PatientSetViewer.activeJobID = job_id;
				i2b2.PatientSetViewer.newResults(job_id);
				i2b2.PatientSetViewer.model.readyToProcess = false;
				i2b2.PatientSetViewer.activePage = 1;
			    })
			.error(function () {
				jQuery.alert({
					boxWidth: '300px',
					    useBootstrap: false,
					    type: 'red',
					    title: 'Oh no!',
					    content: 'Preview Error!',
					    });
			    });
		} else {
		    jQuery.alert({
			    boxWidth: '300px',
				useBootstrap: false,
				type: 'orange',
				title: 'Please Note',
				content: 'In order to view the table of patients, you must first <strong>Create Patient Table to Review</strong>',
				buttons: {
				'OK' : function(){
				    jQuery("#subMenu").accordion({active: 0});

				}
			    }
				});
		    //alert('In order to continue, you must first select a valid patient set.');
		}
	    } else {
		i2b2.PatientSetViewer.loadSavedPatients();  /*In case the user selected a different working folder */
		
	    }
	} else { // Download Button processJob(0)
	    //if (i2b2.PatientSetViewer.model.readyToProcess) {
	    if (!i2b2.PatientSetViewer.model.processLocked) {
			    job = {
				event_type_id: i2b2.PatientSetViewer.downloadID,
				query_master_id: i2b2.PatientSetViewer.queryMasterId,
				model: i2b2.PatientSetViewer.model,
				filterlist: i2b2.PatientSetViewer._getPDOFilterList(),
				patient_set_size: parseInt(i2b2.PatientSetViewer.active.size),
				patient_set_coll_id: i2b2.PatientSetViewer.model.prsRecord.sdxInfo.sdxKeyValue,
				domain: i2b2.PM.model.login_domain,
				userid: i2b2.PM.model.login_username,
				project: i2b2.PM.model.login_project,
				crc_uri: i2b2.CRC.cfg.cellURL,
				login_password: i2b2.PM.model.login_password,
				status: "NEW",
				payload: "New Job"
			    };
				jQuery.post('js-i2b2/cells/plugins/ACT/PatientSetViewer/helper.php', {
					job: JSON.stringify(job),
					preview: 0
				})
					.success(function (job_id) {
                                                i2b2.PatientSetViewer.activeJobID = job_id;
                                                //i2b2.PatientSetViewer.newResults(job_id);
						//                                                i2b2.PatientSetViewer.model.readyToProcess = false;
                                                //i2b2.PatientSetViewer.activePage = 1;

						i2b2.PatientSetViewer.downloadResults(job_id);
					})
					.error(function () {
						jQuery.alert({
							boxWidth: '300px',
							useBootstrap: false,
							type: 'red',
							title: 'Oh no!',
							content: 'Download Error!'
						});
						//alert('Download Error');
					});
	    } else {
		$('PatientSetViewer-TAB1').click();
	    }
	}


};

// 2.0: Get History

i2b2.PatientSetViewer.getHistory = function () {
	$('PatientSetViewer-HistoryProject').innerHTML = 'for ' + i2b2.PM.model.login_projectname;
	$('PatientSetViewer-History').innerHTML = 'Loading...';
	jQuery.ajax({
		type: 'POST',
		url: "js-i2b2/cells/plugins/ACT/PatientSetViewer/history.php",
		data: {
			user_id: i2b2.PM.model.login_username,
			session: i2b2.PM.model.login_password,
			project: i2b2.PM.model.login_project,
			pm_uri: i2b2.PM.cfg.cellURL,
			domain: i2b2.PM.model.login_domain
		},
		success: function (history) {
			$('PatientSetViewer-History').innerHTML = history;
		},
		error: function (history) {
			$('PatientSetViewer-History').innerHTML = 'Unable to fetch history at this time. Please try again later.';
		}
	});
	return false;
};

// 2.0: Cancel on-screen view job
i2b2.PatientSetViewer.cancelViewJob = function (job_id) {

    if (!job_id) {
	job_id = i2b2.PatientSetViewer.activeJobID;
    }

    jQuery.post('js-i2b2/cells/plugins/ACT/PatientSetViewer/cancel.php', {
	    job_id: job_id
        })
    .success(function (result) {
	    jQuery.alert({
		    boxWidth: '300px',
		    useBootstrap: false,
		    title: 'Done!',
		    content: result
		});
	    $('results-section').hide();
	    $('PatientSetViewer-Status').hide();
	    jQuery("#subMenu").accordion({active: 0});
	    i2b2.PatientSetViewer.model.dirtyResultsData = true;
	    i2b2.PatientSetViewer.model.readyToPreview = true;
	    i2b2.PatientSetViewer.model.previewLocked = false;
	})
    .error(function () {
	    jQuery.alert({
		    boxWidth: '300px',
		    useBootstrap: false,
		    type: 'red',
		    title: 'Oh no!',
		    content: 'The cancelling of this job has failed!',
		});
	});

};

// 2.0: Cancel job
i2b2.PatientSetViewer.cancelJob = function (job_id) {

	if (!job_id) {
		job_id = i2b2.PatientSetViewer.activeJobID;
	}

	jQuery.post('js-i2b2/cells/plugins/ACT/PatientSetViewer/cancel.php', {
		job_id: job_id
	})
		.success(function (result) {
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				title: 'Done!',
				content: result
			});
			i2b2.PatientSetViewer.getHistory();

		})
		.error(function () {
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				type: 'red',
				title: 'Oh no!',
				content: 'The cancelling of this job has failed!',
			});
		});

};

// 2.0: Re-run job
i2b2.PatientSetViewer.rerunJob = function (job_id) {

	jQuery.post('js-i2b2/cells/plugins/ACT/PatientSetViewer/rerun.php', {
		job_id: job_id,
		user_id: i2b2.PM.model.login_username,
		session: i2b2.PM.model.login_password
	})
		.success(function (result) {
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				title: 'Done!',
				content: result,
			});
			//alert(result);
			i2b2.PatientSetViewer.getHistory();
			// get job id
			// show results 
		})
		.error(function () {
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				type: 'red',
				title: 'Oh no!',
				content: 'The re-running of this job has failed!'
			});
		});

};


// 2.0: Date Constraints
i2b2.PatientSetViewer.constructDateRangeConstraintXML = function (conceptIndex) {
	var fromMoment = null;
	var toMoment = null;
	if (i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom)
		fromMoment = new moment(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year + "-" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "-" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2));
	if (i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo)
		var toMoment = new moment(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year + "-" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "-" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2));

	var xml = '';
	if (!i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && !i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo)
		return '';
	else if (i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && !i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo)
		xml = '\t\t\t<constrain_by_date>\n' +
			'\t\t\t\t<date_from time="start_date" inclusive= "yes">' + fromMoment.format() + '</date_from>\n' +
			'\t\t\t</constrain_by_date>\n';
	else if (!i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo)
		xml = '\t\t\t<constrain_by_date>\n' +
			'\t\t\t\t<date_to time="start_date" inclusive= "yes">' + toMoment.format() + '</date_to>\n' +
			'\t\t\t</constrain_by_date>\n';
	else
		xml = '\t\t\t<constrain_by_date>\n' +
			'\t\t\t\t<date_from time="start_date" inclusive= "yes">' + fromMoment.format() + '</date_from>\n' +
			'\t\t\t\t<date_to time="start_date" inclusive= "yes">' + toMoment.format() + '</date_to>\n' +
			'\t\t\t</constrain_by_date>\n';
	return xml;
}

// 2.0: Value Constraints

/* returns the XML ValueMetaData*/
i2b2.PatientSetViewer.retrieveValueConstraint = function (conceptIndex) {
	var values = undefined;
	if (i2b2.PatientSetViewer.lastDroppedTerm &&
		i2b2.PatientSetViewer.lastDroppedTerm === i2b2.PatientSetViewer.model.concepts[conceptIndex] &&
		i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData.LabValues) {
		values = i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData.LabValues;
		delete i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData.LabValues;  // delete LabValues because we have saved it
	}
	else
		values = i2b2.PatientSetViewer.model.concepts[conceptIndex].valueRestriction; // read from the constraint saved in the concept object
	return values;
};

// 2.0: Internal function to get PDO filter list
i2b2.PatientSetViewer._getPDOFilterList = function () {

	var filterList = '';
	for (var i1 = 0; i1 < i2b2.PatientSetViewer.model.concepts.length; i1++) {
		var sdxData = i2b2.PatientSetViewer.model.concepts[i1].sdxData;
		if (sdxData.origData.isModifier) { // deal with modifiers
			var modParent = sdxData.origData.parent;
			var level = sdxData.origData.level;
			var key = sdxData.origData.parent.key;
			var name = (sdxData.origData.parent.name != null ? i2b2.h.Escape(sdxData.origData.parent.name) : i2b2.h.Escape(sdxData.origData.name));
			var tooltip = sdxData.origData.tooltip;
			var itemicon = sdxData.origData.hasChildren;
			while (modParent != null) { // find the first ancestor that is not a modifer
				if (modParent.isModifier)
					modParent = modParent.parent;
				else {
					level = modParent.level;
					key = modParent.key;
					name = modParent.name;
					tooltip = modParent.tooltip;
					itemicon = modParent.hasChildren;
					break;
				}
			}

			// get XML representation of the modifier's value restrictions
			var modifierConstraints = (i2b2.PatientSetViewer.model.concepts[i1].valueRestriction != null) ? i2b2.CRC.view.modLabvaluesCtlr.getModLabValuesForXML(i2b2.PatientSetViewer.model.concepts[i1].valueRestriction) : "";
			filterList +=
				'	<panel name="' + i2b2.PatientSetViewer.model.concepts[i1].panel + '">\n' +
				'		<panel_number>0</panel_number>\n' +
				'		<panel_accuracy_scale>0</panel_accuracy_scale>\n' +
				'		<invert>0</invert>\n' +
				'		<item>\n' +
				'			<hlevel>1</hlevel>\n' +
				'           <item_key>' + key + '</item_key>\n' +
				'           <item_name>' + name + '</item_name>\n' +
				'           <tooltip>' + tooltip + '</tooltip>\n' +
				'           <item_icon>' + itemicon + '</item_icon>\n' +
				'           <class>ENC</class>\n' +
				'           <item_is_synonym>false</item_is_synonym>\n' +

				'           <constrain_by_modifier>\n' +
				'              <modifier_name>' + sdxData.origData.name + '</modifier_name>\n' +
				'              <applied_path>' + sdxData.origData.applied_path + '</applied_path>\n' +
				'              <modifier_key>' + sdxData.origData.key + '</modifier_key>\n' +
				modifierConstraints +
				'           </constrain_by_modifier>\n';
			filterList += '		</item>\n' + '	</panel>\n';
		}
		else { // deal with normal concepts
			// get XML representation of the concept's value restrictions
			var valueConstraints = (i2b2.PatientSetViewer.model.concepts[i1].valueRestriction != null) ? i2b2.CRC.view.modLabvaluesCtlr.getModLabValuesForXML(i2b2.PatientSetViewer.model.concepts[i1].valueRestriction) : "";
			var dateConstraints = i2b2.PatientSetViewer.constructDateRangeConstraintXML(i1);
			var t = sdxData.origData.xmlOrig;
			var cdata = {};
			cdata.level = i2b2.h.getXNodeVal(t, "level");
			cdata.key = i2b2.h.getXNodeVal(t, "key");
			cdata.tablename = i2b2.h.getXNodeVal(t, "tablename");
			cdata.dimcode = i2b2.h.getXNodeVal(t, "dimcode");
			cdata.synonym = i2b2.h.getXNodeVal(t, "synonym_cd");
			filterList +=
				'	<panel name="' + i2b2.PatientSetViewer.model.concepts[i1].panel + '">\n' +
				'		<panel_number>' + i1 + '</panel_number>\n' +
				'		<panel_accuracy_scale>0</panel_accuracy_scale>\n' +
				'		<invert>0</invert>\n' +
				'		<item>\n' +
				'			<hlevel>' + cdata.level + '</hlevel>\n' +
				'			<item_key>' + cdata.key + '</item_key>\n' +
				'			<dim_tablename>' + cdata.tablename + '</dim_tablename>\n' +
				'			<dim_dimcode>' + cdata.dimcode + '</dim_dimcode>\n' +
				'			<item_is_synonym>' + cdata.synonym + '</item_is_synonym>\n' +
				'          ' + valueConstraints + '\n' +
				'          ' + dateConstraints;
			filterList += '		</item>\n' + '	</panel>\n';
		}
	}
	return filterList;

};

// 2.0
i2b2.PatientSetViewer._getJobStatus = function (job_id) {
	jQuery.ajax({
		type: 'GET',
		url: "js-i2b2/cells/plugins/ACT/PatientSetViewer/status.php",
		data: { job_id: job_id },
		dataType: 'json',
		cache: false,
		success: function (job) {
			if (job.status == 'NEW') {
				i2b2.PatientSetViewer.model.readyToProcess = false;
				setTimeout(function () {
					i2b2.PatientSetViewer._getJobStatus(job_id);
				}, 1000);
			}
			else if (job.status == 'PREVIEW') {
				jQuery('#PatientSetViewer-PreviewResults tr:gt(0)').remove();
				jQuery('#PatientSetViewer-PreviewResults tr:last').after(job.payload);
				var currentdate = new Date();
				var datetime = (currentdate.getMonth() + 1) + "/"
					+ currentdate.getDate() + "/"
					+ currentdate.getFullYear() + " @ "
					+ currentdate.getHours() + ":"
					+ currentdate.getMinutes() + ":"
					+ currentdate.getSeconds();
				var processTime = document.getElementById('PatientSetViewer-ProcessTime');
				var previewText = document.getElementById('PatientSetViewer-PreviewText');
				previewText.hide();
				$('PatientSetViewer-Status').hide();
				processTime.innerHTML = "";
				//processTime.innerHTML = processTime.innerHTML + " | Finished: " + datetime;
				var previewNumber = 5;
				if (parseInt(i2b2.PatientSetViewer.active.size) < 5) {
					previewNumber = parseInt(i2b2.PatientSetViewer.active.size);
				}
				//	previewText.innerHTML = "Below is a preview of the first "+previewNumber+" out of "+i2b2.PatientSetViewer.active.size+" records from the requested data. If you are satisfied, click on <strong>Proceed to Download</strong> to start processing the entire file.";

				if (i2b2.PatientSetViewer.active.size === parseInt(i2b2.PatientSetViewer.active.size, 10)) {
					var limitingNum = i2b2.PatientSetViewer.active.size;
				}
				else {
					var limitingNum = Number(i2b2.PatientSetViewer.active.size);
				}

				var fetchLimit = 50 + (50 * (i2b2.PatientSetViewer.activePage - 1));

				if (fetchLimit > limitingNum)
					fetchLimit = limitingNum;

				processTime.innerHTML = "<img src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/file.png' align='absbottom'/> You are viewing rows <span style='font-size: 19px;color: #399ae7;'>" + (1 + (50 * (i2b2.PatientSetViewer.activePage - 1))) + "-" + fetchLimit + "</span> out of <span style='font-size: 19px;color: #399ae7;'>" + i2b2.PatientSetViewer.active.size + "</span> rows, one row per patient.";
				//var statusText = document.getElementById('PatientSetViewer-Status');
				//statusText.innerHTML = "<a href='javascript:i2b2.PatientSetViewer.processJob(0)'>Proceed to Download</a>";				
				if ((i2b2.PatientSetViewer.activePage * 50) < parseInt(i2b2.PatientSetViewer.active.size)) {
					$('PatientSetViewer-ProceedButton').show();
				}
				if (i2b2.PatientSetViewer.activePage > 1) {
					$('PatientSetViewer-PreviousButton').show();
				}
				i2b2.PatientSetViewer.loadSavedPatients();
				i2b2.PatientSetViewer.model.processLocked = false;
				i2b2.PatientSetViewer.model.previewLocked = false;
				i2b2.PatientSetViewer.model.dirtyResultsData = false;
				i2b2.PatientSetViewer.model.readyToProcess = true;
			}
			else if (job.status == 'PROCESSING') {
				i2b2.PatientSetViewer.model.processLocked = true;
				$('PatientSetViewer-Processed').innerHTML = job.payload;

				setTimeout(function () {
					i2b2.PatientSetViewer._getJobStatus(job_id);
				}, 2000);

			}
			else if (job.status == 'CANCELLED') {
				i2b2.PatientSetViewer.model.processLocked = true;
				$('PatientSetViewer-downloadstatus').innerHTML = job.payload;
			}
			else if (job.status == 'FINISHED') {
				i2b2.PatientSetViewer.model.processLocked = false;
				i2b2.PatientSetViewer.downloadJob(job_id);
				$('PatientSetViewer-downloadstatus').innerHTML = "<a class=\"PatientSetViewer-button\" style=\"text-decoration:none;font-size:15px;\" href=\"#\" onclick=\"javascript:i2b2.PatientSetViewer.downloadJob('" + job_id + "');return false;\">Download Data File</a>";
			}


		},
		error: function (job) {
			i2b2.PatientSetViewer.model.previewLocked = false;
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				type: 'red',
				title: 'Oh no!',
				content: 'There was an error processing your request!'
			});
			//alert('There was an error processing your request.');
		}
	});
};


//This method generates and displays the patient dataset from previous query
i2b2.PatientSetViewer.newResults = function (job_id) {

	if (i2b2.PatientSetViewer.model.prsRecord) {
		i2b2.PatientSetViewer.setLocalUniqueNumber(); //Set the uniqueid for the download operation
		i2b2.PatientSetViewer.previewRequested = true;
		i2b2.PatientSetViewer.previewResults(job_id);
		i2b2.PatientSetViewer.processJob(1);
	}
};

// 2.0: Download Results

i2b2.PatientSetViewer.downloadResults = function (job_id) {
	$('PatientSetViewer-downloadstatus').innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/ajax.gif" align="absmiddle"/> Processed <span id="PatientSetViewer-Processed" style="font-weight:bold;"></span> [<a href="#" onclick="javascript:i2b2.PatientSetViewer.cancelJob();return false;">Cancel</a>]';

	i2b2.PatientSetViewer.model.processed = 0;

	$('PatientSetViewer-Processed').innerHTML = '0 of ' + i2b2.PatientSetViewer.active.size + ' patients';
	var currentdate = new Date();
	var datetime = (currentdate.getMonth() + 1) + "-"
		+ currentdate.getDate() + "-"
		+ currentdate.getFullYear() + " @ "
		+ currentdate.getHours() + ":"
		+ currentdate.getMinutes() + ":"
		+ currentdate.getSeconds();

	//$('PatientSetViewer-DownloadLink').hide();
	//	$('PatientSetViewer-ProcessTime').innerHTML = "Process Started: " + datetime;

	setTimeout(function () {
		i2b2.PatientSetViewer._getJobStatus(job_id);
	}, 2000);

};

//This method starts creating the result table and the headers.
i2b2.PatientSetViewer.previewResults = function (job_id) {

	i2b2.PatientSetViewer.model.previewLocked = true;
	$('PatientSetViewer-ProcessTime').innerHTML = '';


	$('PatientSetViewer-PreviousButton').hide();
	$('PatientSetViewer-ProceedButton').hide();

	$('results-section').show();
	$('PatientSetViewer-Status').show(); // AJAX icon
	var previewNumber = 5;
	if (parseInt(i2b2.PatientSetViewer.active.size) < 5) {
		previewNumber = parseInt(i2b2.PatientSetViewer.active.size);
	}

	if (i2b2.PatientSetViewer.active.size === parseInt(i2b2.PatientSetViewer.active.size, 10))
		var limitingNum = i2b2.PatientSetViewer.active.size;
	else
		var limitingNum = Number(i2b2.PatientSetViewer.active.size);

	var fetchLimit = 50 + (50 * (i2b2.PatientSetViewer.activePage - 1));

	if (fetchLimit > limitingNum)
		fetchLimit = limitingNum;

	$('PatientSetViewer-PreviewText').innerHTML = "<img src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/file.png' align='absbottom'/> Fetching rows <span style='font-size: 19px;color: #399ae7;'>" + (1 + (50 * (i2b2.PatientSetViewer.activePage - 1))) + "-" + fetchLimit + "</span> out of <span style='font-size: 19px;color: #399ae7;'>" + i2b2.PatientSetViewer.active.size + "</span> patients. [<a href=\"#\" onclick=\"javascript:i2b2.PatientSetViewer.cancelViewJob('" + job_id + "');return false;\">Cancel</a>]";
	$('PatientSetViewer-PreviewText').show();

	i2b2.PatientSetViewer.model.processed = 0;
	i2b2.PatientSetViewer.model.columns = 0;
	var viewResults = $('PatientSetViewer-PreResults');
	var patientSetSize = i2b2.PatientSetViewer.active.size;
	var processTime = $('PatientSetViewer-ProcessTime');
	var currentdate = new Date();
	var datetime = (currentdate.getMonth() + 1) + "-"
		+ currentdate.getDate() + "-"
		+ currentdate.getFullYear() + " @ "
		+ currentdate.getHours() + ":"
		+ currentdate.getMinutes() + ":"
		+ currentdate.getSeconds();

	//processTime.innerHTML = "Process Started: " + datetime;

	var tableHTML = "<table id='PatientSetViewer-PreviewResults'  cellspacing='0'><tr><th><img src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/starred.png'/></th>\n";

	for (var key in i2b2.PatientSetViewer.model.required) {
		if (i2b2.PatientSetViewer.model.required.hasOwnProperty(key)) {
			if (i2b2.PatientSetViewer.model.required[key].display) {
				i2b2.PatientSetViewer.model.columns++;
				tableHTML += "<th>" + i2b2.PatientSetViewer.model.required[key].name + "</th>";
			}
		}
	}

	for (var j = 0; j < i2b2.PatientSetViewer.model.concepts.length; j++) {
		i2b2.PatientSetViewer.model.columns++;
		tableHTML += "<th>" + i2b2.PatientSetViewer.model.concepts[j].textDisplay + "<br/>[" + i2b2.PatientSetViewer.model.concepts[j].dataOption + "]" + i2b2.PatientSetViewer.makeDateRangeConstraintText(j) + "</th>";
	}
	tableHTML += "</tr></table>";
	viewResults.innerHTML = tableHTML;

	setTimeout(function () {
		i2b2.PatientSetViewer._getJobStatus(job_id);
	}, 2000);

	i2b2.PatientSetViewer.model.readyToPreview = false;
	//i2b2.PatientSetViewer.model.readyToProcess = true;
};

//This method starts creating the result table and the headers.
i2b2.PatientSetViewer.viewResults = function () {
	i2b2.PatientSetViewer.model.readyToProcess = false;
	i2b2.PatientSetViewer.dataRequested = true;
	try {
		$('PatientSetViewer-TAB3').click();
	}
	catch (e) {
		//console.log(e);
	}
	jQuery('#PatientSetViewer-Status').hide();

	$('PatientSetViewer-StatusView').innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/ajax.gif" align="absmiddle"/> Processed <span id="PatientSetViewer-Processed" style="font-weight:bold;">0</span> of <span id="PatientSetViewer-PatientSetSize" style="font-weight:bold;">0</span> patients...';
	$('PatientSetViewer-StatusView').show();

	i2b2.PatientSetViewer.model.processed = 0;

	var viewResults = $('PatientSetViewer-ViewResults');
	var processedText = $('PatientSetViewer-Processed');
	var patientSetSizeText = document.getElementById('PatientSetViewer-PatientSetSize');
	var patientSetSize = i2b2.PatientSetViewer.active.size;
	var processTime = $('PatientSetViewer-ProcessTime');
	var currentdate = new Date();
	var datetime = (currentdate.getMonth() + 1) + "-"
		+ currentdate.getDate() + "-"
		+ currentdate.getFullYear() + " @ "
		+ currentdate.getHours() + ":"
		+ currentdate.getMinutes() + ":"
		+ currentdate.getSeconds();

	//$('PatientSetViewer-DownloadLink').hide();
	processTime.innerHTML = "Process Started: " + datetime;
	//processedText.innerHTML = 0;
	patientSetSizeText.innerHTML = patientSetSize;

	if (i2b2.PatientSetViewer.viewResultsTableOption)
		var tableHTML = "<table id='PatientSetViewer-Results' cellspacing='0'><tr>\n";
	i2b2.PatientSetViewer.model.csv = '';
	var requiredfound = false;
	for (var key in i2b2.PatientSetViewer.model.required) {
		if (i2b2.PatientSetViewer.model.required.hasOwnProperty(key)) {
			if (i2b2.PatientSetViewer.model.required[key].display) {
				requiredfound = true;
				i2b2.PatientSetViewer.model.csv += i2b2.PatientSetViewer.model.required[key].name + ",";
				if (i2b2.PatientSetViewer.viewResultsTableOption)
					tableHTML += "<th>" + i2b2.PatientSetViewer.model.required[key].name + "</th>";
			}
		}
	}

	for (var j = 0; j < i2b2.PatientSetViewer.model.concepts.length; j++) {

		if (i2b2.PatientSetViewer.viewResultsTableOption)
			tableHTML += "<th>" + i2b2.PatientSetViewer.model.concepts[j].textDisplay + "<br/>[" + i2b2.PatientSetViewer.model.concepts[j].dataOption + "]" + i2b2.PatientSetViewer.makeDateRangeConstraintText(j) + "</th>";

		i2b2.PatientSetViewer.model.csv += i2b2.PatientSetViewer.model.concepts[j].textDisplay + " (" + i2b2.PatientSetViewer.model.concepts[j].dataOption + ")";
		i2b2.PatientSetViewer.model.csv += ",";
		i2b2.PatientSetViewer.model.csv = i2b2.PatientSetViewer.model.csv.replace('&lt;', '<');
		i2b2.PatientSetViewer.model.csv = i2b2.PatientSetViewer.model.csv.replace('&gt;', '>');
		i2b2.PatientSetViewer.model.csv = i2b2.PatientSetViewer.model.csv.replace('&le;', '<=');
		i2b2.PatientSetViewer.model.csv = i2b2.PatientSetViewer.model.csv.replace('&ge;', '>=');
	}
	if (i2b2.PatientSetViewer.viewResultsTableOption)
		tableHTML += "</tr></table>";
	i2b2.PatientSetViewer.model.csv = i2b2.PatientSetViewer.model.csv.substring(0, i2b2.PatientSetViewer.model.csv.length - 1);  // trim last comma
	i2b2.PatientSetViewer.model.csv += "\n";
	if (i2b2.PatientSetViewer.viewResultsTableOption)
		viewResults.innerHTML = tableHTML;

	i2b2.PatientSetViewer.getResults(1, i2b2.PatientSetViewer.model.pageSize, false);
};

i2b2.PatientSetViewer.setShowMetadataDialog = function (sdxData) {
	i2b2.PatientSetViewer.model.showMetadataDialog = sdxData;
};

i2b2.PatientSetViewer.Unload = function () {
	// purge old data
	i2b2.PatientSetViewer.model = {};
	i2b2.PatientSetViewer.model.prsRecord = false;
	i2b2.PatientSetViewer.model.conceptRecord = false;
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
	try { i2b2.PatientSetViewer.yuiPanel.destroy(); } catch (e) { }
	return true;
};

i2b2.PatientSetViewer.queryConceptDropped = function (sdxData) {
    sdxData = sdxData[0];

    jQuery.confirm({
            boxWidth: '400px',
		useBootstrap: false,
		type: 'orange',
		title: 'Concepts from Previous Query',
		content: 'Would you like to <strong>append</strong> to or <strong>replace</strong> the list of concepts below?',
		buttons: {
                'Append': function () {
                    $("PatientSetViewer-CONCPTDROP").style.background = "#DEEBEF";
                    $("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/spinning.gif" align="absmiddle" style="margin-left:5px;"/> Loading Concepts from Previous Query ...</div>';
                    i2b2.PatientSetViewer.loadQueryConcepts(sdxData.sdxInfo.sdxKeyValue);
                },
		    'Replace': function () {
			$("PatientSetViewer-CONCPTDROP").style.background = "#DEEBEF";
			$("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/spinning.gif" align="absmiddle" style="margin-left:5px;"/> Loading Concepts from Previous Query ...</div>';
			i2b2.PatientSetViewer.model.concepts = [];
			i2b2.PatientSetViewer.loadQueryConcepts(sdxData.sdxInfo.sdxKeyValue);
		    },
			'Cancel': function () {
			    i2b2.PatientSetViewer.conceptsRender();
			}
            }
        });

};


i2b2.PatientSetViewer.wrkDropped = function(sdxData) {
        sdxData = sdxData[0];
	var displayName = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	i2b2.PatientSetViewer.workingFolder = displayName;
        i2b2.PatientSetViewer.folderKey = sdxData.origData.key;
	i2b2.PatientSetViewer.workplaceCartIndex = sdxData.origData.key;

	$("PatientSetViewer-folderbar").innerHTML = displayName;
        $("PatientSetViewer-WRKDROP").style.background = "#DEEBEF";
        $("PatientSetViewer-WRKDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/spinning.gif" align="absmiddle" style="margin-left: 5px;"/> Loading Workplace Folder ...';
        $("PatientSetViewer-workplace").value = displayName;
        $("PatientSetViewer-WRKDROP").style.background = "#CFB";
        $("PatientSetViewer-WRKDROP").innerHTML = '<img src="js-i2b2/cells/WORK/assets/WORK_folder_exp.gif" align="absbottom" style="margin-left: 5px;"/> ' + displayName + '&nbsp;<a href="#" onclick="javascript:i2b2.PatientSetViewer.wrkUnload();return false;"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/delete.png" title="Clear Selection" align="absbottom" border="0"/></a>';
};

i2b2.PatientSetViewer.wrkUnload = function() {
    i2b2.PatientSetViewer.workingFolder = null;
    i2b2.PatientSetViewer.folderKey = null;
    i2b2.PatientSetViewer.workplaceCartIndex = null;

    $("PatientSetViewer-folderbar").innerHTML = 'None';
    $("PatientSetViewer-WRKDROP").style.background = "#DEEBEF";
    $("PatientSetViewer-WRKDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png" align="absbottom" style="margin-left:5px;" /> Drag &amp; Drop a Workplace folder here';

    if(jQuery('#PatientSetViewer-PreviewResults tr')[0] !== undefined){
	jQuery("[id^=save_]").prop('checked', false);
    }
};


i2b2.PatientSetViewer.queryDropped = function (sdxData) {
	sdxData = sdxData[0];

	$("PatientSetViewer-PRSDROP").style.background = "#DEEBEF";
	$("PatientSetViewer-PRSDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/spinning.gif" align="absmiddle" style="margin-left:5px;"/> Loading Previous Query ...';

	// The sdxInfo being loaded/dropped is of sdxType 'QM' (Query Master)
	// Take QM ID and find 1) patient count 2) patient set 3) breakdowns
	i2b2.PatientSetViewer.active.query = sdxData;
	i2b2.PatientSetViewer.loadQueryInfo(sdxData.sdxInfo.sdxKeyValue);
	if (document.getElementById('PatientSetViewer-LoadConcepts').checked) {
		if (i2b2.PatientSetViewer.model.concepts.length > 0) {
			jQuery.confirm({
				boxWidth: '400px',
				useBootstrap: false,
				type: 'blue',
				title: 'Confirm',
				content: 'You have chosen to automatically \'Include concepts from the Previous Query\' which will replace your current list of specified concepts. Click OK to confirm.',
				buttons: {
					ok: function () {
						i2b2.PatientSetViewer.loadQueryConcepts(sdxData.sdxInfo.sdxKeyValue);
					},
					cancel: function () {
						i2b2.PatientSetViewer.conceptsRender();
					}
				}
			});
		} else {
			i2b2.PatientSetViewer.loadQueryConcepts(sdxData.sdxInfo.sdxKeyValue);
		}
	} else {
		i2b2.PatientSetViewer.conceptsRender();
	}

	//    $("PatientSetViewer-patientset").value = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	//BG
	i2b2.PatientSetViewer.model.csv = '';
	i2b2.PatientSetViewer.previewRequested = false;
	i2b2.PatientSetViewer.dataRequested = false;
	//End BG
};

i2b2.PatientSetViewer.queryAutoDropped = function (qm_id) {


	i2b2.PatientSetViewer.loadQueryInfo(qm_id);
	i2b2.PatientSetViewer.loadQueryConcepts(qm_id);
	$("PatientSetViewer-PRSDROP").style.background = "#DEEBEF";
	$("PatientSetViewer-PRSDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/spinning.gif" align="absmiddle" style="margin-left:5px;"/> Loading Previous Query ...';
	//    $("PatientSetViewer-patientset").value = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
};

i2b2.PatientSetViewer.prsUnload = function () {
	i2b2.PatientSetViewer.model.prsRecord = false;
	$("PatientSetViewer-PRSDROP").style.background = "#DEEBEF";
	$("PatientSetViewer-PRSDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png" align="absbottom" style="margin-left:5px;" /> Drag &amp; Drop a <em>Previous Query</em> with a Patient Set here';
	i2b2.PatientSetViewer.active = {};
	//BG
	for (var i = 0; i < i2b2.PatientSetViewer.model.concepts.length; i++) {
		i2b2.PatientSetViewer.conceptDelete(i);
	}
	i2b2.PatientSetViewer.model.csv = '';
	i2b2.PatientSetViewer.previewRequested = false;
	i2b2.PatientSetViewer.dataRequested = false;
	//End BG
};

i2b2.PatientSetViewer.loadQueryInfo = function (query_master_id) {

	i2b2.PatientSetViewer.queryMasterId = query_master_id;
	i2b2.PatientSetViewer.readyToPreview = true;
	i2b2.PatientSetViewer.model.firstVisit = false;

	var scopedCallback = new i2b2_scopedCallback();
	scopedCallback.scope = this;
	scopedCallback.callback = function (results) {
		// THIS function is used to process the AJAX results of the getChild call
		//results data object contains the following attributes:
		//refXML: xmlDomObject <--- for data processing
		//msgRequest: xml (string)
		//msgResponse: xml (string)
		//error: boolean
		//errorStatus: string [only with error=true]
		//errorMsg: string [only with error=true]

		// did we get a valid query definition back?
		var qd = i2b2.h.XPath(results.refXML, 'descendant::query_name/..');
		if (qd.length != 0) {
			i2b2.PatientSetViewer.model.activeQueryName = i2b2.h.getXNodeVal(results.refXML, 'name');
		}


		var scopedCallbackQI = new i2b2_scopedCallback();
		scopedCallbackQI.scope = i2b2.PatientSetViewer.active.query;
		scopedCallbackQI.callback = function (results) {

			var qi = results.refXML.getElementsByTagName('query_instance');
			i2b2.PatientSetViewer.active.query_instance_id = i2b2.h.getXNodeVal(qi[0], 'query_instance_id');

			var scopedCallbackQRS = new i2b2_scopedCallback();
			scopedCallbackQRS.scope = i2b2.PatientSetViewer.active.query;
			scopedCallbackQRS.callback = function (results) {
				var found_patient_set = false;
				i2b2.PatientSetViewer.active.QRS = [];
				var results_list = results.refXML.getElementsByTagName('query_result_instance');
				var l = results_list.length;
				for (var i = 0; i < l; i++) {
					try {
						var qi = results_list[i];
						var temp = new Object();
						temp.size = i2b2.h.getXNodeVal(qi, 'set_size');
						temp.QI_ID = i2b2.h.getXNodeVal(qi, 'query_instance_id');
						temp.QRS_ID = i2b2.h.getXNodeVal(qi, 'result_instance_id');
						temp.QRS_Type = i2b2.h.XPath(qi, 'descendant-or-self::query_result_type/name')[0].firstChild.nodeValue;
						temp.QRS_DisplayType = i2b2.h.XPath(qi, 'descendant-or-self::query_result_type/display_type')[0].firstChild.nodeValue;
						temp.QRS_TypeID = i2b2.h.XPath(qi, 'descendant-or-self::query_result_type/result_type_id')[0].firstChild.nodeValue;
						temp.QRS_Status = i2b2.h.XPath(qi, 'descendant-or-self::query_status_type/name')[0].firstChild.nodeValue;
						temp.QRS_Status_ID = i2b2.h.XPath(qi, 'descendant-or-self::query_status_type/status_type_id')[0].firstChild.nodeValue;
						// set the proper title if it was not already set
						if (!temp.title) {
							temp.title = i2b2.CRC.ctrlr.QueryStatus._GetTitle(temp.QRS_Type, temp, qi);
						}
						if (temp.QRS_Status_ID != 3) {
							$("PatientSetViewer-PRSDROP").innerHTML = 'There was a problem loading this query. Please try a different query.';
							$("PatientSetViewer-PRSDROP").style.background = "#F6CCDA";
							jQuery.alert({
								boxWidth: '300px',
								useBootstrap: false,
								type: 'orange',
								title: 'Please Wait',
								content: 'The selected query is unfinished! Please select a finished query to make a request'
							});
							//alert("The selected query is unfinished! Please select a finished query to make a request.");
							break;
						}
						i2b2.PatientSetViewer.active.QRS.push(temp);
					} catch (e) { }
				}

				// Start loop through Query Result Set
				for (var i = 0; i < i2b2.PatientSetViewer.active.QRS.length; i++) {
					var query_result = i2b2.PatientSetViewer.active.QRS[i];
					switch (query_result.QRS_DisplayType) {
						case "LIST": // Check to see if query has a Patient Set
							if (query_result.QRS_Type == "PATIENTSET") {
								//alert("Patient Set has been found");
								found_patient_set = true;
								var sdxTemp = {
									sdxInfo: {
										sdxControlCell: "CRC", sdxDisplayName: query_result.title,
										sdxKeyName: "result_instance_id", sdxKeyValue: query_result.QRS_ID, sdxType: "PRS"
									}
								};
								i2b2.PatientSetViewer.model.prsRecord = sdxTemp;
								i2b2.PatientSetViewer.model.dirtyResultsData = true;
								i2b2.PatientSetViewer.active.size = query_result.size;

							}
							break;
					}
				} // End loop through Query Result Set

				if (found_patient_set) {

					$("PatientSetViewer-PRSDROP").innerHTML = '<img src="js-i2b2/cells/CRC/assets/sdx_CRC_PRS.jpg" align="absbottom" style="margin-left:5px;"/> ' + i2b2.h.Escape(i2b2.PatientSetViewer.model.activeQueryName) + '&nbsp;<strong>[Patient Count: ' + i2b2.PatientSetViewer.active.size + ']</strong>&nbsp;<a href="#" onclick="javascript:i2b2.PatientSetViewer.prsUnload();return false;"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/delete.png" title="Clear Selection" align="absbottom" border="0"/></a>';
					$("PatientSetViewer-PRSDROP").style.background = "#CFB";
					i2b2.PatientSetViewer.model.readyToPreview = true;
					i2b2.PatientSetViewer.model.firstVisit = false;
				}
				else {
					$("PatientSetViewer-PRSDROP").innerHTML = ' A patient set was not found for this query. Please try a different query.';
					$("PatientSetViewer-PRSDROP").style.background = "#F6CCDA";
					i2b2.PatientSetViewer.model.readyToPreview = false;
				}
			}
			i2b2.CRC.ajax.getQueryResultInstanceList_fromQueryInstanceId("Plugin:PatientSetViewer", { qi_key_value: i2b2.PatientSetViewer.active.query_instance_id }, scopedCallbackQRS);
		}
		i2b2.CRC.ajax.getQueryInstanceList_fromQueryMasterId("Plugin:PatientSetViewer", { qm_key_value: query_master_id }, scopedCallbackQI);


	}
	i2b2.CRC.ajax.getRequestXml_fromQueryMasterId("Plugin:PatientSetViewer", { qm_key_value: query_master_id }, scopedCallback);
};


i2b2.PatientSetViewer.prsDropped = function (sdxData) {
	sdxData = sdxData[0];	// only interested in first record
	// save the info to our local data model
	i2b2.PatientSetViewer.model.prsRecord = sdxData;
	// let the user know that the drop was successful by displaying the name of the patient set
	$("PatientSetViewer-PRSDROP").innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	// temporarly change background color to give GUI feedback of a successful drop occuring
	$("PatientSetViewer-PRSDROP").style.background = "#CFB";
	setTimeout("$('PatientSetViewer-PRSDROP').style.background='#DEEBEF'", 250);
	// optimization to prevent requerying the hive for new results if the input dataset has not changed
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
	/*
					var sdxTemp = {sdxInfo: { sdxControlCell: "CRC", sdxDisplayName: query_result.title,
							  sdxKeyName: "result_instance_id", sdxKeyValue: query_result.QRS_ID, sdxType: "PRS" }};
				i2b2.PatientSetViewer.model.prsRecord = sdxTemp;
				i2b2.PatientSetViewer.model.dirtyResultsData = true;
				i2b2.PatientSetViewer.active.size = query_result.size;*/
};


i2b2.PatientSetViewer.loadQueryConcepts = function (qm_id) {
	//for (var i = 0; i < i2b2.PatientSetViewer.model.concepts.length; i++) 
	//{
	//    i2b2.PatientSetViewer.conceptDelete(i);
	//}
    	if (!document.getElementById('PatientSetViewer-AppendConcepts').checked) {
		i2b2.PatientSetViewer.model.concepts = []
		}
	i2b2.PatientSetViewer.conceptsRender();
	////
	// callback processor
	var scopedCallback = new i2b2_scopedCallback();
	scopedCallback.scope = this;
	scopedCallback.callback = function (results) {
		var cl_queryMasterId = qm_id;
		// THIS function is used to process the AJAX results of the getChild call
		//results data object contains the following attributes:
		//refXML: xmlDomObject <--- for data processing
		//msgRequest: xml (string)
		//msgResponse: xml (string)
		//error: boolean
		//errorStatus: string [only with error=true]
		//errorMsg: string [only with error=true]

		// did we get a valid query definition back?
		var qd = i2b2.h.XPath(results.refXML, 'descendant::query_name/..');
		if (qd.length != 0) {
			var dObj = {};
			dObj.name = i2b2.h.getXNodeVal(results.refXML, 'name');
			dObj.timing = i2b2.h.XPath(qd[0], 'descendant-or-self::query_timing/text()');
			dObj.timing = dObj.timing[0].nodeValue;
			dObj.specificity = i2b2.h.getXNodeVal(qd[0], 'specificity_scale');
			var sqc = i2b2.h.XPath(qd[0], 'subquery_constraint');
			var noConceptsToDisplay = true;
			for (var j = 0; j < qd.length; j++) {
				dObj.panels = [];
				if (j == 0)
					var qp = i2b2.h.XPath(qd[j], 'panel');
				else
					var qp = i2b2.h.XPath(qd[j], 'descendant::panel');
				var total_panels = qp.length;
				for (var i1 = 0; i1 < total_panels; i1++) {
					// extract the data for each panel
					var po = {};
					po.panel_num = i2b2.h.getXNodeVal(qp[i1], 'panel_number');
					var t = i2b2.h.getXNodeVal(qp[i1], 'invert');
					po.exclude = (t == "1");
					po.timing = i2b2.h.getXNodeVal(qp[i1], 'panel_timing') || 'ANY';
					var t = i2b2.h.getXNodeVal(qp[i1], 'total_item_occurrences');
					po.occurs = (1 * t) - 1;
					var t = i2b2.h.getXNodeVal(qp[i1], 'panel_accuracy_scale');
					po.relevance = t;

					po.items = [];
					var pi = i2b2.h.XPath(qp[i1], 'descendant::item[item_key]');

					for (i2 = 0; i2 < pi.length; i2++) {
						var item = {};
						// get the item's details from the ONT Cell
						var ckey = i2b2.h.getXNodeVal(pi[i2], 'item_key');
						// Determine what item this is
						if (ckey.startsWith("query_master_id")) {
							var o = new Object;
							o.name = i2b2.h.getXNodeVal(pi[i2], 'item_name');
							o.id = ckey.substring(16);
							o.result_instance_id = o.PRS_id;
							var sdxDataNode = i2b2.sdx.Master.EncapsulateData('QM', o);
							po.items.push(sdxDataNode);
						}
						else if (ckey.startsWith("masterid")) {
							var o = new Object;
							o.name = i2b2.h.getXNodeVal(pi[i2], 'item_name');
							o.id = ckey;
							o.result_instance_id = o.PRS_id;
							var sdxDataNode = i2b2.sdx.Master.EncapsulateData('QM', o);
							po.items.push(sdxDataNode);
						}
						else if (ckey.startsWith("patient_set_coll_id")) {
							var o = new Object;
							o.titleCRC = i2b2.h.getXNodeVal(pi[i2], 'item_name');
							o.PRS_id = ckey.substring(20);
							o.result_instance_id = o.PRS_id;
							var sdxDataNode = i2b2.sdx.Master.EncapsulateData('PRS', o);
							po.items.push(sdxDataNode);
						}
						else if (ckey.startsWith("patient_set_enc_id")) {
							var o = new Object;
							o.titleCRC = i2b2.h.getXNodeVal(pi[i2], 'item_name');
							o.PRS_id = ckey.substring(19);
							o.result_instance_id = o.PRS_id;
							var sdxDataNode = i2b2.sdx.Master.EncapsulateData('ENS', o);
							po.items.push(sdxDataNode);
						}
						else {
							// WE MUST QUERY THE ONT CELL TO BE ABLE TO DISPLAY THE TREE STRUCTURE CORRECTLY
							var o = new Object;
							o.level = i2b2.h.getXNodeVal(pi[i2], 'hlevel');
							o.name = i2b2.h.getXNodeVal(pi[i2], 'item_name');
							o.tooltip = i2b2.h.getXNodeVal(pi[i2], 'tooltip');
							// nw096 - If string starts with path \\, lookup path in Ontology cell
							if (o.name.slice(0, 2) == '\\\\') {
								var results = i2b2.ONT.ajax.GetTermInfo("ONT", { ont_max_records: 'max="1"', ont_synonym_records: 'false', ont_hidden_records: 'false', concept_key_value: o.name }).parse();
								if (results.model.length > 0) {
									o.name = results.model[0].origData.name;
									o.tooltip = results.model[0].origData.tooltip;
									o.tablename = results.model[0].origData.tablename;
								}
							}
							o.key = i2b2.h.getXNodeVal(pi[i2], 'item_key');
							o.synonym_cd = i2b2.h.getXNodeVal(pi[i2], 'item_is_synonym');
							o.hasChildren = i2b2.h.getXNodeVal(pi[i2], 'item_icon');


							// Lab Values processing
							var lvd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_value');
							if ((lvd.length > 0) /*&& (i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier').length == 0)*/) {
								lvd = lvd[0];
								//Get term info for genotype data to populate labvalues well
								o.LabValues = i2b2.CRC.view.modLabvaluesCtlr.processLabValuesForQryLoad(lvd);
							}
							// sdx encapsulate
							var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT', o);

							// Date processing - 2.0 (handle constrain_by_date)
							var cbd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_date');
							if (cbd.length > 0) {
								cbd = cbd[0];
								var df = i2b2.h.getXNodeVal(cbd, "date_from");
								if (df) {
									sdxDataNode.dateFrom = {};
									sdxDataNode.dateFrom.Year = df.substring(0, 4); //t[0];
									sdxDataNode.dateFrom.Month = df.substring(5, 7); //t[1];
									sdxDataNode.dateFrom.Day = df.substring(8, 10); //t[2];
								}
								else {
									sdxDataNode.dateFrom = false;
								}
								var dt = i2b2.h.getXNodeVal(cbd, "date_to");
								if (dt) {
									sdxDataNode.dateTo = {};
									sdxDataNode.dateTo.Year = dt.substring(0, 4); //t[0];
									sdxDataNode.dateTo.Month = dt.substring(5, 7); //t[1];
									sdxDataNode.dateTo.Day = dt.substring(8, 10); //t[2];
								}
								else {
									sdxDataNode.dateTo = false;
								}
							}
							else {
								sdxDataNode.dateFrom = false;
								sdxDataNode.dateTo = false;
							}

							// nw096 - handle file icons
							switch (o.hasChildren) {
								case "FA":
									sdxDataNode.renderData = { icon: 'js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_branch.gif' };
									break;
								case "LA":
									sdxDataNode.renderData = { icon: 'js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_leaf.gif' };
									break;
								case "FAE":
									sdxDataNode.renderData = { icon: 'js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_branch-exp.gif' };
									break;
								default:
									sdxDataNode.renderData = { icon: 'js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_leaf.gif' };
							}

							if (o.LabValues) {
								// We do want 2 copies of the Lab Values: one is original from server while the other one is for user manipulation
								sdxDataNode.LabValues = o.LabValues;
							}
							//			    o.xmlOrig = c;
							if (i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier').length > 0) {
								//if (i2b2.h.getXNodeVal(pi[i2],'constrain_by_modifier') != null) {
								sdxDataNode.origData.parent = {};
								sdxDataNode.origData.parent.key = o.key;
								//sdxDataNode.origData.parent.LabValues = o.LabValues;
								sdxDataNode.origData.parent.hasChildren = o.hasChildren;
								sdxDataNode.origData.parent.level = o.level;
								sdxDataNode.origData.parent.name = o.name;
								sdxDataNode.origData.key = i2b2.h.getXNodeVal(pi[i2], 'constrain_by_modifier/modifier_key');
								sdxDataNode.origData.applied_path = i2b2.h.getXNodeVal(pi[i2], 'constrain_by_modifier/applied_path');
								sdxDataNode.origData.name = i2b2.h.getXNodeVal(pi[i2], 'constrain_by_modifier/modifier_name');
								sdxDataNode.origData.isModifier = true;
								this.hasModifier = true;

								// Lab Values processing
								var lvd = i2b2.h.XPath(pi[i2], 'descendant::constrain_by_modifier/constrain_by_value');
								if (lvd.length > 0) {
									lvd = lvd[0];
									o.ModValues = i2b2.CRC.view.modLabvaluesCtlr.processModValuesForQryLoad(lvd);
								}
								if (o.ModValues) {
									// We do want 2 copies of the Lab Values: one is original from server while the other one is for user manipulation
									sdxDataNode.ModValues = o.ModValues;
								}
							}

							noConceptsToDisplay = false;
							i2b2.PatientSetViewer.conceptAutoDropped(sdxDataNode);

						}
					}

				}
			}
			if (noConceptsToDisplay) {
				jQuery.alert({
					boxWidth: '300px',
					useBootstrap: false,
					type: 'orange',
					title: 'Sorry!',
					content: 'There are no concepts to display'
				});
				$("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png" align="absbottom" style="margin-left:5px;" /> Drag &amp; Drop additional concepts here from <em>Navigate Terms</em> or a <em>Previous Query</em></div>';
			}
		}
	}
	// AJAX CALL
	i2b2.CRC.ajax.getRequestXml_fromQueryMasterId("Plugin:PatientSetViewer", { qm_key_value: qm_id }, scopedCallback);
};


i2b2.PatientSetViewer.conceptAutoDropped = function (sdxData) {
	if (sdxData.origData.isModifier) {
		jQuery.alert({
			boxWidth: '300px',
			useBootstrap: false,
			type: 'orange',
			title: 'Sorry!',
			content: 'Modifier item being dropped is not supported yet.'
		});
		//alert("Modifier item being dropped is not yet supported.");
		return false;
	}
	var conceptObj = {};
	conceptObj.sdxData = sdxData;



	conceptObj.valueRestriction = sdxData.LabValues;              // save Lab Value
	conceptObj.dateFrom = sdxData.dateFrom;
	conceptObj.dateTo = sdxData.dateTo;

	// Default value for data option is EXISTENCE. Attach dataOption and formatter to the newly added concept
	conceptObj.dataOption = i2b2.PatientSetViewer.cellDataOption.DEFAULT;
	//conceptObj.formatter = i2b2.PatientSetViewer.cellFormatter.defaultFormatter;


	var cdetails = i2b2.ONT.ajax.GetTermInfo("CRC:DownloaderPlugin", { concept_key_value: sdxData.origData.key, ont_synonym_records: true, ont_hidden_records: true });
	var c = i2b2.h.XPath(cdetails.refXML, 'descendant::concept');
	if (c.length > 0)
	{ sdxData.origData.xmlOrig = c[0]; }

	cdetails.parse();
	if (cdetails.model.length > 0) {
		//	i2b2.PatientSetViewer.nich3 = cdetails.model[0];
		sdxData.origData.basecode = cdetails.model[0].origData.basecode;
		sdxData.origData.fact_table_column = cdetails.model[0].origData.fact_table_column;
		sdxData.origData.table_name = cdetails.model[0].origData.table_name;
		sdxData.origData.column_name = cdetails.model[0].origData.column_name;
		sdxData.origData.operator = cdetails.model[0].origData.operator;
		sdxData.origData.dim_code = cdetails.model[0].origData.dim_code;
	}

	//BG changes for new value chooser
	if (sdxData.LabValues)
		conceptObj.LabValues = sdxData.LabValues;

	//Parse the concept more if possible
	try {
		var dataType = i2b2.h.getXNodeVal(sdxData.origData.xmlOrig, 'DataType');
		var valueType = i2b2.CRC.view.modLabvaluesCtlr.getValueType(dataType);
		if (dataType && valueType)  //Handle Genotype concept
		{
			var updatedLabValues = i2b2.CRC.view[valueType].parseLabValues(conceptObj.LabValues, dataType);
			if (updatedLabValues)
				conceptObj.LabValues = updatedLabValues;
		}
	}
	catch (e) {
		console.error(e);
	}

	//Adding if block BG to get rid of old concepts that does not exist in the ontology any more
	if (cdetails.model.length > 0) {
		// save the info to our local data model
		i2b2.PatientSetViewer.model.concepts.push(conceptObj);
		//End BG changes

		var sdxDataNode = i2b2.sdx.Master.EncapsulateData('CONCPT', sdxData.origData);

		// sort and display the concept list
		i2b2.PatientSetViewer.conceptsRender();
		// optimization to prevent requerying the hive for new results if the input dataset has not changed

		$("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png" align="absbottom" style="margin-left:5px;" /> Drag &amp; Drop additional concepts here from <em>Navigate Terms</em> or a <em>Previous Query</em></div>';

		i2b2.PatientSetViewer.model.dirtyResultsData = true;
	}
	else {
		jQuery.alert({
			boxWidth: '300px',
			useBootstrap: false,
			type: 'orange',
			title: 'Sorry!',
			content: 'Concept ' + sdxData.origData.name + ' does not exist in the ontology. Thus it can not be used.'
		});
		//alert('Concept ' + sdxData.origData.name + ' does not exist in the ontology. Thus it can not be used.');
		$("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png" align="absbottom" style="margin-left:5px;" /> Drag &amp; Drop additional concepts here from <em>Navigate Terms</em> or a <em>Previous Query</em></div>';
	}
};

i2b2.PatientSetViewer.conceptDropped = function (sdxData, showDialog) {

	sdxData = sdxData[0];	// only interested in first record
	if (sdxData.origData.isModifier) {
		var cdetails = i2b2.ONT.ajax.GetModifierInfo("CRC:QueryTool", { modifier_applied_path: sdxData.origData.applied_path, modifier_key_value: sdxData.origData.key, ont_synonym_records: true, ont_hidden_records: true });
		// this is what comes out of the old AJAX call
		var c = i2b2.h.XPath(cdetails.refXML, 'descendant::modifier');
		if (c.length > 0)
			sdxData.origData.xmlOrig = c[0];
		var modParent = sdxData.origData.parent;
		var level = sdxData.origData.level;
		var key = sdxData.origData.parent.key;
		var name = (sdxData.origData.parent.name != null ? i2b2.h.Escape(sdxData.origData.parent.name) : i2b2.h.Escape(sdxData.origData.name));
		var tooltip = sdxData.origData.tooltip;
		var itemicon = sdxData.origData.hasChildren;
		while (modParent != null) // find the first ancestor that is not a modifer
		{
			if (modParent.isModifier)
				modParent = modParent.parent;
			else {
				level = modParent.level;
				key = modParent.key;
				name = modParent.name;
				tooltip = modParent.tooltip;
				itemicon = modParent.hasChildren;
				break;
			}
		}
		sdxData.renderData.icon = "js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_branch.gif"; // display every modifier as its containing parent (a folder)
		sdxData.sdxInfo.sdxDisplayName = modParent.name;
	}
	else // fetch normal concept data
	{
		if (sdxData.origData.table_name.toLowerCase() == "visit_dimension") {
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				type: 'orange',
				title: 'Sorry!',
				content: 'Visit Dimension Concepts are not supported at this time.'
			});
			//alert('Visit Dimension Concepts are not supported at this time.');
			return false;
		}
		var cdetails = i2b2.ONT.ajax.GetTermInfo("CRC:DownloaderPlugin", { concept_key_value: sdxData.origData.key, ont_synonym_records: true, ont_hidden_records: true });
		var c = i2b2.h.XPath(cdetails.refXML, 'descendant::concept');
		if (c.length > 0)
			sdxData.origData.xmlOrig = c[0];
	}

	// Create a concept 'object' to contain the sdxData and concept options.
	var conceptObj = {};
	conceptObj.sdxData = sdxData;
	// Default value for data option is EXISTENCE. Attach dataOption and formatter to the newly added concept
	conceptObj.dataOption = i2b2.PatientSetViewer.cellDataOption.DEFAULT;
	//conceptObj.formatter  = i2b2.PatientSetViewer.cellFormatter.defaultFormatter;
	// save the concept object to our local data model
	i2b2.PatientSetViewer.model.concepts.push(conceptObj);

	i2b2.PatientSetViewer.lastDroppedTerm = conceptObj;     // remember the last Concept that is dropped 

	// Timer for message

	$("PatientSetViewer-CONCPTDROP").style.background = "#cffbb9";
	$("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><span style="margin-left:5px;">Concept successfully added to the list below</span></div>';

	setTimeout(function(){
		$("PatientSetViewer-CONCPTDROP").style.background = "#DEEBEF";
		$("PatientSetViewer-CONCPTDROP").innerHTML = '<div class="concptItem"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png" align="absbottom" style="margin-left:5px;" /> Drag &amp; Drop additional concepts here from <em>Navigate Terms</em> or a <em>Previous Query</em></div>';
	    }, 2000);


	// check to see if the new concept usese value retrictions (whether as a normal concept or a modifier)
	var lvMetaDatas1 = i2b2.h.XPath(sdxData.origData.xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');

	if ((lvMetaDatas1.length > 0) && (i2b2.PatientSetViewer.model.showMetadataDialog)) {
		//bring up popup for concepts with value restrictions
		//Change for new value chooser architecture by BG
		i2b2.PatientSetViewer.currentTerm = conceptObj;     // remember the last Concept that is dropped 
		i2b2.CRC.view.modLabvaluesCtlr.selectValueBox(0, null, sdxData.origData.key, sdxData, false, i2b2.PatientSetViewer);
	}
	else {
		// sort and display the concept list
		i2b2.PatientSetViewer.conceptsRender();

	}
	// optimization to prevent requerying the hive for new results if the input dataset has not changed
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
	i2b2.PatientSetViewer.model.readyToPreview = true;
};

i2b2.PatientSetViewer.conceptDelete = function (concptIndex) {
	// remove the selected concept
	i2b2.PatientSetViewer.model.concepts.splice(concptIndex, 1);
	// sort and display the concept list
	i2b2.PatientSetViewer.conceptsRender();
	// optimization to prevent requerying the hive for new results if the input dataset has not changed
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
};

i2b2.PatientSetViewer.Resize = function () {
	z = $('anaPluginViewFrame').getHeight() - 40; //- 34;  //BG vertical scrollbar display issues
	var viewportOffset1 = $('anaPluginViewFrame').getBoundingClientRect();
	var viewportOffset2 = $('PatientSetViewer-mainDiv').getBoundingClientRect();
	if ((viewportOffset1 && viewportOffset2) && (viewportOffset1.top > viewportOffset2.top)) {
		var parentDiv = jQuery('#anaPluginViewFrame');
		var childDiv = jQuery('#PatientSetViewer-mainDiv');
		parentDiv.scrollTop(parentDiv.scrollTop() + childDiv.position().top - 5);
	}
};

i2b2.PatientSetViewer.wasHidden = function () {
	try { i2b2.PatientSetViewer.yuiPanel.destroy(); } catch (e) { }
};

i2b2.PatientSetViewer.getNumbersOnly = function(){
    i2b2.PatientSetViewer.model.dirtyResultsData = true;
    i2b2.PatientSetViewer.model.readyToPreview = true;

    if (jQuery("#PatientSetViewer-patientsonly").prop('checked')){
	i2b2.PatientSetViewer.numbersOnly = true;
	jQuery('#PatientSetViewer-conceptsbar').hide();
	i2b2.PatientSetViewer.model.concepts = [];
	i2b2.PatientSetViewer.model.required.id.display = true;
	i2b2.PatientSetViewer.model.required.age.display = false;
	i2b2.PatientSetViewer.model.required.gender.display = false;
	i2b2.PatientSetViewer.model.required.race.display = false;

	jQuery("#ui-id-4").slideDown(300);

	i2b2.PatientSetViewer.conceptsRender();

    } else {
	i2b2.PatientSetViewer.numbersOnly = false;
	i2b2.PatientSetViewer.model.required.id.display = true;
        i2b2.PatientSetViewer.model.required.age.display = true;
        i2b2.PatientSetViewer.model.required.gender.display = true;
        i2b2.PatientSetViewer.model.required.race.display = true;

	jQuery('#PatientSetViewer-conceptsbar').show();
	jQuery("#ui-id-4").hide();
	if(i2b2.PatientSetViewer.active.query !== undefined){
	    i2b2.PatientSetViewer.loadQueryConcepts(i2b2.PatientSetViewer.active.query.sdxInfo.sdxKeyValue);
	}
    }

};

i2b2.PatientSetViewer.removeRequired = function (req_key) {
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
	i2b2.PatientSetViewer.model.readyToPreview = true;
	if (document.getElementById("chk_" + req_key).checked) {
		i2b2.PatientSetViewer.model.required[req_key].display = true;
	} else {
		i2b2.PatientSetViewer.model.required[req_key].display = false;
	}

};

i2b2.PatientSetViewer.editConcept = function (conceptIndex) {

	var conceptObj = i2b2.PatientSetViewer.model.concepts[conceptIndex];
	i2b2.PatientSetViewer.currentTerm = conceptObj;     // remember the last Concept that is dropped 
	i2b2.CRC.view.modLabvaluesCtlr.selectValueBox(0, null, i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData.origData.key,
		i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData, false, i2b2.PatientSetViewer);
};

i2b2.PatientSetViewer.getValueType = function (xmlOrig) {
	var returnValues = {};
	returnValues.valueMetadataNodes = i2b2.h.XPath(xmlOrig, 'metadataxml/ValueMetadata[string-length(Version)>0]');
	if (returnValues.valueMetadataNodes.length > 0) {
		// check to see if the dropped concept uses numeric, enum, or blob values.
		var dataTypeArray = i2b2.h.XPath(returnValues.valueMetadataNodes[0], 'DataType');
		if (dataTypeArray.length > 0) {
			var dataType = jQuery(dataTypeArray[0]).text().toLowerCase();
			if ((dataType == "posinteger") || (dataType == "integer") || (dataType == "posfloat") || (dataType == "float"))
				returnValues.valueType = i2b2.PatientSetViewer.valueType.NUMERIC;
			else if (dataType == "enum")
				returnValues.valueType = i2b2.PatientSetViewer.valueType.ENUM;
			else if (dataType == "largestring")
				returnValues.valueType = i2b2.PatientSetViewer.valueType.BLOB;
			else
				returnValues.valueType = i2b2.PatientSetViewer.valueType.UNKNOWN; // no known type, it's a bug if UNKNOWN is returned.
			return returnValues;
		}
	}
	return null; // No Value Metadata 
};

i2b2.PatientSetViewer.spanifyInactiveValueConstraint = function () {
	return "<span class=\"valueConstraint_Inactive\">[Set Value Constraint]</span>"; // uses no value constraint
};

i2b2.PatientSetViewer.spanifyValueConstraint = function (name, conceptIndex) {
	return "[<a class =\"valueConstraint\" href=\"JavaScript:i2b2.PatientSetViewer.editConcept(" + conceptIndex + ");\">" + name + "</a>]";
};


/* pass in a values object and this function returns text representation */
i2b2.PatientSetViewer.makeValueText = function (values) {
	var tt = "";
	if (undefined != values) {
		switch (values.MatchBy) {
			case "FLAG":
				tt = ' = ' + i2b2.h.Escape(values.ValueFlag);
				break;
			case "VALUE":
				if (values.GeneralValueType == "ENUM") {
					var sEnum = [];
					for (var i2 = 0; i2 < values.ValueEnum.length; i2++)
						sEnum.push(i2b2.h.Escape(values.ValueEnum[i2]));
					sEnum = sEnum.join("\", \"");
					sEnum = ' =  ("' + sEnum + '")';
					tt = sEnum;
				}
				else if ((values.GeneralValueType == "LARGESTRING") || (values.GeneralValueType == "TEXT")) {
					tt = 'contains "' + i2b2.h.Escape(values.ValueString) + '"';
				}
				else if (values.GeneralValueType == "STRING") {
					if (values.StringOp == undefined)
						var stringOp = "";
					else {
						switch (values.StringOp) {
							case "LIKE[exact]":
								var stringOp = "Exact: ";
								break;
							case "LIKE[begin]":
								var stringOp = "Starts With: ";
								break;
							case "LIKE[end]":
								var stringOp = "Ends With: ";
								break;
							case "LIKE[contains]":
								var stringOp = "Contains: ";
								break;
							default:
								var stringOp = "";
								break;
						}
					}
					tt = ' [' + stringOp + i2b2.h.Escape(values.ValueString) + "]";
				}
				else if (values.GeneralValueType == "GENOTYPE") {
					if (values.searchByRsId) {
						var containsText = values.ValueString + ((values.Zygosity && values.Zygosity != '') ? (" AND " + values.Zygosity) : "") + ((values.Allele && values.Allele != '') ? (" AND " + values.Allele) : "") + ((values.Consequence && values.Consequence != '') ? (" AND " + values.Consequence) : "");
					}
					if (values.searchByGeneName) {
						var containsText = values.ValueString + ((values.Zygosity && values.Zygosity != '') ? (" AND " + values.Zygosity) : "") + ((values.Consequence && values.Consequence != '') ? (" AND " + values.Consequence) : "");
					}
					tt = 'contains "' + containsText + '"';
				}
				else { // numeric value
					var unit = "";
					if (!Object.isUndefined(values.UnitsCtrl))
						unit = values.UnitsCtrl;
					if (values.NumericOp == 'BETWEEN')
						tt = i2b2.h.Escape(values.ValueLow) + ' - ' + i2b2.h.Escape(values.ValueHigh);
					else {
						switch (values.NumericOp) {
							case "LT":
								var numericOp = "< ";
								break;
							case "LE":
								var numericOp = "<= ";
								break;
							case "EQ":
								var numericOp = "= ";
								break;
							case "GT":
								var numericOp = "> ";
								break;
							case "GE":
								var numericOp = ">= ";
								break;
							case "":
								break;
						}
						tt = numericOp + i2b2.h.Escape(values.Value);
					}
					tt = tt + "" + unit;
				}
				break;
			case "":
				break;
		}
	}
	return tt;
}

/* pass in a values object and this function returns an innerHTML suitable for display */
i2b2.PatientSetViewer.makeValueConstraintInnerHTML = function (valueInfo, values, conceptIndex) {
	var valueText = "";
	if (!valueInfo)
		return '';
	valueText = i2b2.PatientSetViewer.makeValueText(values);
	if (valueText === "")
		valueText = "Set Value"; // empty constraint

	valueHTML = "<img align=\"absbottom\" style=\"margin-left:10px;\" src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/value.png\" border=\"0\"/> [<a data-tooltip=\"This concept can be constrained by a specific value\" class=\"valueConstraint\" href=\"JavaScript:i2b2.PatientSetViewer.editConcept(" + conceptIndex + ");\">" + valueText + "</a>]";
	return valueHTML;
};

i2b2.PatientSetViewer.makeValueConstraintText = function (valueInfo, values) {
	var valueText = "";
	if (!valueInfo)
		return "";
	valueText = i2b2.PatientSetViewer.makeValueText(values);
	if (valueText === "")
		return "";

	valueText = " [" + valueText + "]";
	return valueText;
};

i2b2.PatientSetViewer.sanitizeConcepts = function () {  //works for genotype and ppv concepts
	for (var i1 = 0; i1 < i2b2.PatientSetViewer.model.concepts.length; i1++) {
		// Check if GENOTYPE value has constraint. If not, remove it
		// if(i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.key.indexOf('Biobank Genomics\\Gene\\') > -1 || i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.key.indexOf('Biobank Genomics\\dbSNP rs Identifier\\') > -1){
		if (!i2b2.PatientSetViewer.model.concepts[i1].hasOwnProperty('valueRestriction')) {
			i2b2.PatientSetViewer.conceptDelete(i1);
		}
		// }
	}
};

i2b2.PatientSetViewer.modifyConceptList = function () {
	i2b2.PatientSetViewer.sanitizeConcepts();
};

i2b2.PatientSetViewer.conceptsRenderFromValueBox = function () {
	i2b2.PatientSetViewer.currentTerm.valueRestriction = i2b2.PatientSetViewer.currentTerm.LabValues;
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
	// update the panel/query tool GUI
	i2b2.PatientSetViewer.conceptsRender(); //update GUI
};

i2b2.PatientSetViewer.conceptsRender = function () {
	var s = '<table style="width:98%;margin-top:15px;"><tr><td style="font-size:13px;padding:5px;background:#7d98b8;color:#FFF;font-weight:bold;text-shadow:none;">Concept</td><td style="font-size:13px;padding:5px;background:#7d98b8;color:#FFF;font-weight:bold;text-shadow:none;">Constraints</td><td style="font-size:13px;padding:5px;background:#7d98b8;color:#FFF;font-weight:bold;text-shadow:none;">Aggregation Option</td><td style="font-size:13px;padding:5px;background:#7d98b8;color:#FFF;font-weight:bold;text-shadow:none;">Include</td></tr>'; // innerHTML for concept list
	var t = ''; // innerHTML for concpet config
	// are there any concepts in the list

	if (i2b2.PatientSetViewer.numbersOnly){

	    s += "<tr><td><img align=\"absbottom\" style=\"margin-left:5px;\" src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/demographic.png\" border=\"0\"> Patient Number</td><td></td><td>";
	    s += "<select class=\"conceptConfigSelect\"> <option value=\"value\">Value</option></select>";
	    s += "</td><td><input type=\"checkbox\" id=\"chk_id\"";
	    s += " checked=\"checked\" disabled=\"disabled\"></td></tr>";

	} else {
	    
	    for (var key in i2b2.PatientSetViewer.model.required) {
		if (i2b2.PatientSetViewer.model.required.hasOwnProperty(key)) {
		    s += "<tr><td><img align=\"absbottom\" style=\"margin-left:5px;\" src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/demographic.png\" border=\"0\"> " + i2b2.PatientSetViewer.model.required[key].name + "</td><td></td><td>";
		    s += "<select class=\"conceptConfigSelect\"> <option value=\"value\">Value</option></select>";
		    s += "</td><td><input type=\"checkbox\" id=\"chk_" + key + "\"";
		    if (i2b2.PatientSetViewer.model.required[key].display) {
			s += " checked=\"checked\"";
		    }
		    s += " onchange=\"javascript:i2b2.PatientSetViewer.removeRequired('" + key + "');\"></td></tr>";
		}
	    }
	}


	if (i2b2.PatientSetViewer.model.concepts.length > 0) {
		jQuery("#PatientSetViewer-CONCPTCONFIG").show();      // display concept configuration table
		i2b2.PatientSetViewer.model.concepts.sort(function () // sort the concepts in alphabetical order
		{
			return arguments[0].sdxData.sdxInfo.sdxDisplayName > arguments[1].sdxData.sdxInfo.sdxDisplayName
		});
		// draw the list of concepts
		for (var i1 = 0; i1 < i2b2.PatientSetViewer.model.concepts.length; i1++) {

			if (i1 > 0) {
				s += '<div class="concptDiv"></div>'; // create horizontal divider between concepts, starting with the 1st concept
				t += '<div class="concptDiv"></div>';
			}
			valueHTML = "";
			valueText = "";
			tt = i2b2.PatientSetViewer.spanifyInactiveValueConstraint('[Set Value Constraint]');
			// get an appropriate path for the ontology term's icon
			var conceptIconPath = undefined;
			if (i2b2.PatientSetViewer.model.concepts[i1].sdxData.renderData) // this is a concept from ONTOLOGY
				conceptIconPath = i2b2.PatientSetViewer.model.concepts[i1].sdxData.renderData.icon;
			else                                                                        // this is a concept from WORKPLACE
				conceptIconPath = i2b2.PatientSetViewer.model.concepts[i1].sdxData.iconExp;
			var modInfo = null;
			var modValues = null;
			var valueInfo = null;
			var values = null;
			if (i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.isModifier) {
				//modInfo = i2b2.PatientSetViewer.getValueType(i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.xmlOrig); // this gets the modifier's value metadata
				//modValues = i2b2.PatientSetViewer.retrieveValueConstraint(i0, i1);
			}
			else {
				// gather value metadata information: valueInfo.valueType (NUMERIC, ENUM, BLOB) and valueInfo.valueMetadataNodes (actual XML nodes)
				valueInfo = i2b2.PatientSetViewer.getValueType(i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.xmlOrig);
				// now we obtain the actual Value Constraint (if any) associated with the concept
				values = i2b2.PatientSetViewer.retrieveValueConstraint(i1);


				// create HTML for the value constraint
				valueHTML = i2b2.PatientSetViewer.makeValueConstraintInnerHTML(valueInfo, values, i1);
				valueText = i2b2.PatientSetViewer.makeValueConstraintText(valueInfo, values);
			}

			//	values = i2b2.PatientSetViewer.model.concepts[i1].sdxData.LabValues;

			var textDisplay = i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.sdxInfo.sdxDisplayName);
			var tooltip = "";
			if (i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.tooltip){
			    tooltip = i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.tooltip);
			}

			if (i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.isModifier)
				if (valueHTML === "")
					textDisplay = i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.sdxInfo.sdxDisplayName) + " [" + i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.name) + "]";
				else
					textDisplay = i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.sdxInfo.sdxDisplayName) + " [" + i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.name) + tt + "]";
			else
				textDisplay = i2b2.h.Escape(i2b2.PatientSetViewer.model.concepts[i1].sdxData.sdxInfo.sdxDisplayName);
			i2b2.PatientSetViewer.model.concepts[i1].textDisplay = textDisplay.replace(/,/g, "-") + valueText; // save the text display back to the conceptObj data structure so the table can display it correctly
			i2b2.PatientSetViewer.model.concepts[i1].panel = i1;

			var dateText = i2b2.PatientSetViewer.makeDateRangeConstraintInnerHTML(i1);
			s += "<tr><td><img align=\"absbottom\" style=\"margin-left:5px;\" src=\"" + conceptIconPath + "\" border=\"0\"> <span title=\"" + tooltip + "\">" + textDisplay + "</span></td><td style=\"color:#575757\">" + dateText + valueHTML + "</td><td>";

			// if a [patient_dimension] concept, only allow EXISTENCE and COUNT (to-do)
			var concept_table_name = i2b2.PatientSetViewer.model.concepts[i1].sdxData.origData.table_name;
			if (concept_table_name) {
				if (concept_table_name.toLowerCase() === 'patient_dimension') {
					s += "<select onchange=\"i2b2.PatientSetViewer.setTooltip(" + i1 + ");\" id=\"" + i2b2.PatientSetViewer.columnDisplaySelectID + i1 + "\" class=\"conceptConfigSelect\">\n" +
						"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "\">" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "</option>\n" +
						"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLVALUES + "\">Value</option>\n" +
						"</select> <a id='tooltip" + i1 + "' href='#' onclick='return false;' data-tooltip='Any existence of the observation'><img style='margin-bottom:-3px;' src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/tooltip.png'/></a>";
					//s += "<select id=\"" + i2b2.PatientSetViewer.columnDisplaySelectID + i1 + "\" class=\"conceptConfigSelect\"> <option value=\"" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "\">Yes/No</option></select>";
				}
                                else if (concept_table_name.toLowerCase() === 'visit_dimension') {
                                        s += "<select id=\"" + i2b2.PatientSetViewer.columnDisplaySelectID + i1 + "\" class=\"conceptConfigSelect\">\n" +
					    "<option selected='selected'>None</option>\n" +
					    "</select> <a id='tooltip" + i1 + "' href='#' onclick='return false;' data-tooltip='Visit dimension concepts are not currently supported. This column will be blank.'><img style='margin-bottom:-3px;' src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/warn.png'/></a>";

				}
				else { // [concept_dimension] or [modifier_dimension]

					if ((concept_table_name && concept_table_name.toLowerCase() === 'concept_dimension') &&
						(valueInfo && (valueInfo.valueType !== i2b2.PatientSetViewer.valueType.MIXED))) {
						if (valueInfo.valueType === i2b2.PatientSetViewer.valueType.NUMERIC) {
							s += "<select onchange=\"i2b2.PatientSetViewer.setTooltip(" + i1 + ");\" id=\"" + i2b2.PatientSetViewer.columnDisplaySelectID + i1 + "\" class=\"conceptConfigSelect\">\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "\">" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLVALUES + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLVALUES + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODE + "\">" + i2b2.PatientSetViewer.cellDataOption.MODE + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MIN + "\">" + i2b2.PatientSetViewer.cellDataOption.MIN + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MAX + "\">" + i2b2.PatientSetViewer.cellDataOption.MAX + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.AVERAGE + "\">" + i2b2.PatientSetViewer.cellDataOption.AVERAGE + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MEDIAN + "\">" + i2b2.PatientSetViewer.cellDataOption.MEDIAN + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.FIRST + "\">" + i2b2.PatientSetViewer.cellDataOption.FIRST + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.LAST + "\">" + i2b2.PatientSetViewer.cellDataOption.LAST + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.COUNT + "\">" + i2b2.PatientSetViewer.cellDataOption.COUNT + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT + "\">" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT + "</option>n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE + "\">" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE + "</option>\n" +
								"</select> <a id='tooltip" + i1 + "' href='#' onclick='return false;' data-tooltip='Any existence of the observation'><img style='margin-bottom:-3px;' src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/tooltip.png'/></a>";
						} else {
							s += "<select onchange=\"i2b2.PatientSetViewer.setTooltip(" + i1 + ");\" id=\"" + i2b2.PatientSetViewer.columnDisplaySelectID + i1 + "\" class=\"conceptConfigSelect\">\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "\">" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLVALUES + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLVALUES + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODE + "\">" + i2b2.PatientSetViewer.cellDataOption.MODE + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.FIRST + "\">" + i2b2.PatientSetViewer.cellDataOption.FIRST + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.LAST + "\">" + i2b2.PatientSetViewer.cellDataOption.LAST + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.COUNT + "\">" + i2b2.PatientSetViewer.cellDataOption.COUNT + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT + "\">" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT + "</option>n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE + "</option>\n" +
								"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE + "\">" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE + "</option>\n" +
								"</select> <a id='tooltip" + i1 + "' href='#' onclick='return false;' data-tooltip='Any existence of the observation'><img style='margin-bottom:-3px;' src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/tooltip.png'/></a>";
						}
					}
					else { // no values
						s += "<select onchange=\"i2b2.PatientSetViewer.setTooltip(" + i1 + ");\" id=\"" + i2b2.PatientSetViewer.columnDisplaySelectID + i1 + "\" class=\"conceptConfigSelect\">\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "\">" + i2b2.PatientSetViewer.cellDataOption.DEFAULT + "</option>\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.FIRST + "\">" + i2b2.PatientSetViewer.cellDataOption.FIRST + "</option>\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.LAST + "\">" + i2b2.PatientSetViewer.cellDataOption.LAST + "</option>\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.COUNT + "\">" + i2b2.PatientSetViewer.cellDataOption.COUNT + "</option>\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT + "</option>\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT + "\">" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT + "</option>n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE + "\">" + i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE + "</option>\n" +
							"<option value=\"" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE + "\">" + i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE + "</option>\n" +
							"</select> <a id='tooltip" + i1 + "' href='#' onclick='return false;' data-tooltip='Any existence of the observation'><img style='margin-bottom:-3px;' src='js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/tooltip.png'/></a>";
					}
				}
				s += "</td><td><a href=\"JavaScript:i2b2.PatientSetViewer.conceptDelete(" + i1 + ");\"><img src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/delete.png\" title=\"Remove this Concept\" align=\"absbottom\" border=\"0\"/></a></td></tr>";
			}
		}
		$("PatientSetViewer-CONCPTDROP").style.padding = "0px 0px";     // remove extra vertical padding
		$("PatientSetViewer-CONCPTCONFIG").style.padding = "0px 0px";   // remove extra vertical padding
	}
	else // no concepts selected yet
	{
		//s = "<img src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/pointer.png\" align=\"absbottom\" style=\"margin-left:5px;\" /> Drag &amp; Drop one or more <em>Ontology Terms</em> here";
		//s = "";
		//$("PatientSetViewer-CONCPTDROP").style.padding = "5px 0px";
		//jQuery("#PatientSetViewer-CONCPTCONFIG").hide(); // hide concept config table
	}
	s += "</table>";

	$("PatientSetViewer-CONCEPTS").innerHTML = s;


	// add default values to select elements and bind a handler to listen for change events
	for (var j = 0; j < i2b2.PatientSetViewer.model.concepts.length; j++) {
	    if(i2b2.PatientSetViewer.model.concepts[j].sdxData.origData.table_name.toLowerCase() !== 'visit_dimension'){
		var select = jQuery("#" + i2b2.PatientSetViewer.columnDisplaySelectID + j);
		if (i2b2.PatientSetViewer.model.concepts[j].dataOption) {
			select.val(i2b2.PatientSetViewer.model.concepts[j].dataOption);
			i2b2.PatientSetViewer.setTooltip(j);
			i2b2.PatientSetViewer.setDateTooltip(j);
		}
		select.on("change", null, { index: j, value: select.val() }, i2b2.PatientSetViewer.handleConceptConfigItemSelectionChange); // attach listener to handle selection change
	    }
	}
};

i2b2.PatientSetViewer.showDateRangeConstraintDialog = function (conceptIndex) {
	i2b2.PatientSetViewer.UI.DateConstraint.showDates(conceptIndex);
};

// construct the innerHTML for the concptItem div to include
i2b2.PatientSetViewer.makeDateRangeConstraintInnerHTML = function (conceptIndex) {   // date constraints do not make sense for patient dimension concepts
	var concept_table_name = i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData.origData.table_name;
	if (!concept_table_name) {
		return;
	}
	if (concept_table_name.toLowerCase() === 'patient_dimension')
		return "";

	var dateText = "";

	if (!i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && !i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo) {
		dateText = "Set Date";
	}
	else if (i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && !i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo) {
		dateText = "&ge;" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year;
	}
	else if (!i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo) {
		dateText = "&le;" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year;
	}
	else {
		dateText = padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year + " to " + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year;
	}
	return "<img align=\"absbottom\" style=\"margin-left:5px;\" src=\"js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/calendar.gif\" border=\"0\"><span> [<a id=\"dateTooltip" + conceptIndex + "\" data-tooltip=\"\" class=\"dateRangeConstraint\" href=\"JavaScript:i2b2.PatientSetViewer.showDateRangeConstraintDialog(" + conceptIndex + ");\">" + dateText + "</a>]</span>";
};

i2b2.PatientSetViewer.makeDateRangeConstraintText = function (conceptIndex) {   // date constraints do not make sense for patient dimension concepts
	var concept_table_name = i2b2.PatientSetViewer.model.concepts[conceptIndex].sdxData.origData.table_name;
	if (!concept_table_name) {
		return;
	}
	if (concept_table_name.toLowerCase() === 'patient_dimension')
		return "";

	var dateText = "";
	var concept = i2b2.PatientSetViewer.model.concepts[conceptIndex];
	var dateFrom = concept.hasOwnProperty('dateFrom');
	var dateTo = concept.hasOwnProperty('dateTo');

	if (dateFrom) {
		if (concept.dateFrom == false) {
			dateFrom = false;
		}
	}
	if (dateTo) {
		if (concept.dateTo == false) {
			dateTo = false;
		}
	}
	if (!dateFrom && !dateTo) {
		return "";
	}

	if (dateFrom && !dateTo) {
		dateText = "From " + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year;
	}
	else if (!dateFrom && dateTo) {
		dateText = "To " + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year;
	}
	else {
		dateText = padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year + " to " + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year;
	}
	return "<br/>[" + dateText + "]";
};


i2b2.PatientSetViewer.setDateTooltip = function (conceptIndex) {
	var dateTooltip = "";

	if (!i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && !i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo) {
		dateTooltip = "Optional Date Range Constraint is not set";
	}
	else if (i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && !i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo) {
		dateText = padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year;
		dateTooltip = "Only find this concept starting from " + dateText;
	}
	else if (!i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom && i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo) {
		dateText = padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year;
		dateTooltip = "Only find this concept until " + dateText;
	}
	else {
		dateText = padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateFrom.Year + " to " + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Month, 2) + "/" + padNumber(i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Day, 2) + "/" + i2b2.PatientSetViewer.model.concepts[conceptIndex].dateTo.Year;
		dateTooltip = "Only find this concept from " + dateText;
	}
	jQuery('#dateTooltip' + conceptIndex).attr('data-tooltip', dateTooltip);
};

i2b2.PatientSetViewer.setTooltip = function (index) {
	var select = jQuery("#" + i2b2.PatientSetViewer.columnDisplaySelectID + index).val();
	switch (select) {
		case i2b2.PatientSetViewer.cellDataOption.DEFAULT:
			var tooltip = "Any existence of the observation";
			break;
		case i2b2.PatientSetViewer.cellDataOption.MIN:
			var tooltip = "Minimum value of all numerical values observations";
			break;
		case i2b2.PatientSetViewer.cellDataOption.MAX:
			var tooltip = "Maximum value of all numerical values observations";
			break;
		case i2b2.PatientSetViewer.cellDataOption.FIRST:
			var tooltip = "Date of earliest observation";
			break;
		case i2b2.PatientSetViewer.cellDataOption.LAST:
			var tooltip = "Date of the most recent observation";
			break;
		case i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTTEXT:
			var tooltip = "All concept names are listed";
			break;
		case i2b2.PatientSetViewer.cellDataOption.MODECONCEPTTEXT:
			var tooltip = "Most frequent concept name(s) are listed";
			break;
		case i2b2.PatientSetViewer.cellDataOption.ALLCONCEPTCODE:
			var tooltip = "All concept codes are listed";
			break;
		case i2b2.PatientSetViewer.cellDataOption.MODECONCEPTCODE:
			var tooltip = "Most frequent concept code(s) are listed";
			break;
		case i2b2.PatientSetViewer.cellDataOption.COUNT:
			var tooltip = "Total number of observations";
			break;
		case i2b2.PatientSetViewer.cellDataOption.AVERAGE:
			var tooltip = "Average Value";
			break;
		case i2b2.PatientSetViewer.cellDataOption.MEDIAN:
			var tooltip = "Median Value";
			break;
		case i2b2.PatientSetViewer.cellDataOption.ALLVALUES:
			var tooltip = "List of All Value(s)";
			break;
		case i2b2.PatientSetViewer.cellDataOption.MODE:
			var tooltip = "Mode (Most Frequent Value)";
			break;
	}
	jQuery('#tooltip' + index).attr('data-tooltip', tooltip);


};

i2b2.PatientSetViewer.handleConceptConfigItemSelectionChange = function (event) {
	i2b2.PatientSetViewer.model.dirtyResultsData = true;
	i2b2.PatientSetViewer.model.readyToPreview = true;
	var newVal = jQuery("#" + i2b2.PatientSetViewer.columnDisplaySelectID + event.data.index).children("option").filter(":selected").val();
	i2b2.PatientSetViewer.model.concepts[event.data.index].dataOption = newVal;

};


i2b2.PatientSetViewer.WORKAlert = function () {
	jQuery('#workAlertSpan').html("To create workplace folder right click on <br/> an existing folder here and then select New Folder");
    jQuery('#workAlert').show().delay(5000).fadeOut();
};

i2b2.PatientSetViewer.setLocalUniqueNumber = function () {
	var date = new Date();

	var components = [
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate(),
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
		date.getMilliseconds()
	];

	var id = components.join("");

	i2b2.PatientSetViewer.downloadID = id;
};
