/**
 * @project     Patient List Exporter
 * @description JS Controller for Patient List Exporter Plugin
 * @inherits    i2b2
 * @namespace   i2b2.PatientListExporter
 * @author      Bhaswati Ghosh
 * @version     1.4
 * Copyright (c) 2006-2018 Massachusetts General Hospital
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the i2b2 Software License v2.1
 * which accompanies this distribution.
 *
 * ----------------------------------------------------------------------------------------
 */

i2b2.PatientListExporter.folderKey = null;
i2b2.PatientListExporter.result_for_folder = false;
i2b2.PatientListExporter.result_for_query = false;

i2b2.PatientListExporter.icons = $H({"PREV_QUERY":"js-i2b2/cells/CRC/assets/sdx_CRC_QM_workplace.jpg",
"PATIENT_COLL":"js-i2b2/cells/CRC/assets/sdx_CRC_PRS.jpg",
"ENCOUNTER_COLL":"js-i2b2/cells/CRC/assets/sdx_CRC_PRS.jpg",
"PATIENT":"js-i2b2/cells/CRC/assets/sdx_CRC_PR.jpg",
"PATIENT_COUNT_XML":"js-i2b2/cells/CRC/assets/sdx_CRC_PRC.jpg",
"GROUP_TEMPLATE":"js-i2b2/cells/CRC/assets/sdx_CRC_QGDEF.jpg",
"QUERY_DEFINITION":"js-i2b2/cells/CRC/assets/sdx_CRC_QDEF.jpg"});

i2b2.PatientListExporter.noChildren = $H();

i2b2.PatientListExporter.active = new Object();
 
i2b2.PatientListExporter.Init = function(loadedDiv) {
	i2b2.PatientListExporter.model.prsRecord = false;
	var op_trgt = {dropTarget:true};
	i2b2.sdx.Master.AttachType("PatientListExporter-PRSDROP", "QM", op_trgt);
	i2b2.sdx.Master.setHandlerCustom("PatientListExporter-PRSDROP", "QM", "DropHandler", i2b2.PatientListExporter.queryDropped);

	var wrk_trgt = {dropTarget:true};
	i2b2.sdx.Master.AttachType("PatientListExporter-WRKDROP", "WRK", wrk_trgt);
	i2b2.sdx.Master.setHandlerCustom("PatientListExporter-WRKDROP", "WRK", "DropHandler", i2b2.PatientListExporter.wrkDropped);
	
	// manage YUI tabs
	this.yuiTabs = new YAHOO.widget.TabView("PatientListExporter-TABS", {activeIndex:0});
	
	z = $('anaPluginViewFrame').getHeight() - 34;
	$$('DIV#PatientListExporter-TABS DIV.PatientListExporter-MainContent')[0].style.height = z;
	$$('DIV#PatientListExporter-TABS DIV.PatientListExporter-MainContent')[1].style.height = z;
	
	//Use web service to get all root work folders for current project and draw the initial tree
};

i2b2.PatientListExporter.Unload = function() {
	// purge old data
	i2b2.PatientListExporter.folderKey = null;
	i2b2.PatientListExporter.noChildren = $H();
	$("PatientListExporter-PRSDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/pointer.png" align="absbottom" /> Drag & Drop a Previous Query with a Patient Set here';
	return true;
};

i2b2.PatientListExporter.prsUnload = function() {
	i2b2.PatientListExporter.model.prsRecord = false;
	$("PatientListExporter-PRSDROP").style.background = "#DEEBEF";
	$("PatientListExporter-PRSDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/pointer.png" align="absbottom" /> Drag & Drop a Previous Query with a Patient Set here';
	$("PatientListExporter-patientset").value = "";
	
};

i2b2.PatientListExporter.wrkUnload = function() {
	i2b2.PatientListExporter.folderKey = null;
	$("PatientListExporter-WRKDROP").style.background = "#DEEBEF";
	$("PatientListExporter-WRKDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/pointer.png" align="absbottom" /> Drag & Drop a Workplace Folder here';
	
};

i2b2.PatientListExporter.wrkDropped = function(sdxData) {
	i2b2.PatientListExporter.prsUnload();
	sdxData = sdxData[0];
	i2b2.PatientListExporter.folderKey = sdxData.origData.key;
	$("PatientListExporter-WRKDROP").style.background = "#DEEBEF";
	$("PatientListExporter-WRKDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/spinning.gif" align="absmiddle"/> Loading Workplace Folder ...';
	var displayName = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	$("PatientListExporter-workplace").value = displayName;
	$("PatientListExporter-WRKDROP").style.background = "#CFB";
	$("PatientListExporter-WRKDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/WORK_folder_exp.gif" align="absbottom"/> ' + displayName + '&nbsp;<a href="#" onclick="javascript:i2b2.PatientListExporter.wrkUnload();return false;"><img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/delete.png" title="Clear Selection" align="absbottom" border="0"/></a>';
};

i2b2.PatientListExporter.queryDropped = function(sdxData) {
	i2b2.PatientListExporter.wrkUnload();
	sdxData = sdxData[0];
	i2b2.PatientListExporter.model.prsRecord = sdxData;
	i2b2.PatientListExporter.loadQuery(sdxData);
};

i2b2.PatientListExporter.loadQuery = function(sdxData) {
	i2b2.PatientListExporter.active.query = sdxData;
	// The sdxInfo being loaded/dropped is of sdxType 'QM' (Query Master)
	// Take QM ID and find 1) patient count 2) patient set 3) breakdowns

	i2b2.PatientListExporter.loadQueryInfo(sdxData.sdxInfo.sdxKeyValue);
	$("PatientListExporter-PRSDROP").style.background = "#DEEBEF";
	$("PatientListExporter-PRSDROP").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/spinning.gif" align="absmiddle"/> Loading Previous Query ...';
	i2b2.PatientListExporter.model.dirtyResultsData = true;		
	$("PatientListExporter-patientset").value = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	
	//i2b2.CRC.ctrlr.QT.doQueryLoad(sdxData.sdxInfo.sdxKeyValue);
	document.getElementById("PatientListExporter-qmid").value = i2b2.PatientListExporter.active.query.origData.id;
};

i2b2.PatientListExporter.loadQueryInfo = function(query_master_id){

	var scopedCallbackQI = new i2b2_scopedCallback();
	scopedCallbackQI.scope = i2b2.PatientListExporter.active.query;
	scopedCallbackQI.callback = function(results) {
		
		var qi = results.refXML.getElementsByTagName('query_instance');
		i2b2.PatientListExporter.active.query_instance_id = i2b2.h.getXNodeVal(qi[0],'query_instance_id');
		
		var query_status_type_name = i2b2.h.getXNodeVal(qi[0],'query_status_type/name');
		
		var scopedCallbackQRS = new i2b2_scopedCallback();
		scopedCallbackQRS.scope = i2b2.PatientListExporter.active.query;
		scopedCallbackQRS.callback = function(results) {
			var found_patient_set = false;
			i2b2.PatientListExporter.active.QRS = [];
			var results_list = results.refXML.getElementsByTagName('query_result_instance');
			var l = results_list.length;
			for (var i=0; i<l; i++) {
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
					if(temp.QRS_Status_ID!=3)
					{
						$("PatientListExporter-PRSDROP").innerHTML = 'There was a problem loading this query. Please try a different query.';
						$("PatientListExporter-PRSDROP").style.background = "#F6CCDA";
						document.getElementById("PatientListExporter-limited-report").style.display="none";
						alert("The selected query is unfinished! Please select a finished query to make a request.");
						break;
					}
					i2b2.PatientListExporter.active.QRS.push(temp);
				} catch	(e) {}
			}
			
			// Start loop through Query Result Set
			i2b2.PatientListExporter.active.catnums = {};
			var catnum_count = 0;
			for (var i=0; i<i2b2.PatientListExporter.active.QRS.length; i++) {
				var query_result = i2b2.PatientListExporter.active.QRS[i];
				switch (query_result.QRS_DisplayType) {
					case "LIST": // Check to see if query has a Patient Set
						if(query_result.QRS_Type == "PATIENTSET"){
							found_patient_set = true;
							var sdxTemp = {sdxInfo: { sdxControlCell: "CRC", sdxDisplayName: query_result.title,
							  sdxKeyName: "result_instance_id", sdxKeyValue: query_result.QRS_ID, sdxType: "PRS" }};
							i2b2.PatientListExporter.model.prsRecord = sdxTemp;
							i2b2.PatientListExporter.model.dirtyResultsData = true;
							i2b2.PatientListExporter.active.size = query_result.size;
						}
						break;
				}
			} // End loop through Query Result Set 
			if (found_patient_set) {
				$("PatientListExporter-PRSDROP").innerHTML = '<img src="js-i2b2/cells/CRC/assets/sdx_CRC_PRS.jpg" align="absbottom"/> ' + i2b2.h.Escape(i2b2.PatientListExporter.active.query.sdxInfo.sdxDisplayName) + '&nbsp;<a href="#" onclick="javascript:i2b2.PatientListExporter.prsUnload();return false;"><img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/delete.png" title="Clear Selection" align="absbottom" border="0"/></a>';
				$("PatientListExporter-PRSDROP").style.background = "#CFB";
			}
			else {
				$("PatientListExporter-PRSDROP").innerHTML = ' A patient set was not found for this query. Please try a different query.';
				$("PatientListExporter-PRSDROP").style.background = "#F6CCDA";
				i2b2.PatientListExporter.model.prsRecord = false;
			}
		}
		
		if(query_status_type_name == "ERROR"){
			$("PatientListExporter-PRSDROP").innerHTML = 'There was a problem loading this query. Please try a different query.';
			$("PatientListExporter-PRSDROP").style.background = "#F6CCDA";
		} else {
			i2b2.CRC.ajax.getQueryResultInstanceList_fromQueryInstanceId("Plugin:PatientListExporter", {qi_key_value: i2b2.PatientListExporter.active.query_instance_id}, scopedCallbackQRS);
		}
	}
	i2b2.CRC.ajax.getQueryInstanceList_fromQueryMasterId("Plugin:PatientListExporter", {qm_key_value: query_master_id}, scopedCallbackQI);
};



// i2b2.PatientListExporter.requestBy = function(method) {
	// jQuery("#PatListRequestBtnHolder").removeClass("hidden");
	// if(method == "folder"){
		// i2b2.PatientListExporter.result_for_folder = true;
		// i2b2.PatientListExporter.result_for_query = false;
		// jQuery("#PatientListExporter-byquery").hide();
		// jQuery("#PatientListExporter-byWFolder").show();
	// }
	// else if(method == "previousquery"){
		// i2b2.PatientListExporter.result_for_folder = false;
		// i2b2.PatientListExporter.result_for_query = true;
		// jQuery("#PatientListExporter-byWFolder").hide();
		// jQuery("#PatientListExporter-patientlist").val('');
		// jQuery("#PatientListExporter-nonnumber").hide();
		// noSubmit = false;
		// jQuery("#PatientListExporter-byquery").show();
	// }
// };

//Handler for fetching child nodes of parent folder
i2b2.PatientListExporter.getResults = function() {
	
    // create callback display routine
    var scopedCallback = new i2b2_scopedCallback();
    scopedCallback.scope = i2b2.WORK;
    scopedCallback.callback = function(results){
        var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
        i2b2.PatientListExporter.downloadFile(nlst);
    };
    if(!i2b2.PatientListExporter.noChildren.get(i2b2.PatientListExporter.folderKey))
	{
		// ajax communicator call
		var varInput = {
			parent_key_value: i2b2.PatientListExporter.folderKey,
			result_wait_time: 180
		};
		i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallback);
	}
};

//Handler for the download button
i2b2.PatientListExporter.createResultsForWorkplaceFolder = function() {
	if(!i2b2.PatientListExporter.folderKey)
	{
		jQuery.alert({
			boxWidth: '400px',
			useBootstrap: false,
			title: 'Patient list can\'t be downloaded!',
			content: 'Please select a folder first to download the Patient list'
		});

		return;
	}
	i2b2.PatientListExporter.getResults();	
	
};

//Handler for the download button
i2b2.PatientListExporter.createResultsForPrevQuery = function() {
	if(!i2b2.PatientListExporter.model.prsRecord)
	{
		jQuery.alert({
			boxWidth: '400px',
			useBootstrap: false,
			title: 'Patient list can\'t be downloaded!',
			content: 'Please select a patient set to download the Patient list'
		});
		return;
	}
	else{
		var sUrl = i2b2["WORK"].cfg.cellURL;
		var domain = "domain=" + i2b2.PM.model.login_domain;
		var project = "&project=" + i2b2.PM.model.login_project;
		var userId = "&user_id=" + i2b2.PM.model.login_username;
		var session = "&session=" + i2b2.PM.model.login_password;
		var msgId = "&msgId=" + i2b2.h.GenerateAlphaNumId(20);
		var patientSetSize = "&patient_set_size=" + i2b2.PatientListExporter.active.size;
		var patientSetCollId = "&patient_set_coll_id=" + i2b2.PatientListExporter.model.prsRecord.sdxInfo.sdxKeyValue;
		var cellUrl = "&cell_url=" + encodeURIComponent(i2b2.CRC.cfg.cellURL) + "pdorequest";
		var url = "js-i2b2/cells/plugins/ACT/PatientListExporter/PatientsListGenerator_FromQuery.php?"+ domain + project + userId + session +  msgId + patientSetSize + patientSetCollId + cellUrl;
		$("PatListRequestBtn").innerHTML = '<img src="js-i2b2/cells/plugins/ACT/PatientListExporter/assets/spinning.gif" align="absmiddle"/> Loading results ..';
		jQuery.fileDownload(url)
		.done(function () { 
			$("PatListRequestBtn").innerHTML = 'Download Patient List';
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				title: 'Success!',
				content: 'Patient file was successfully downloaded'
			});
		})
		.fail(function () { 
			$("PatListRequestBtn").innerHTML = 'Download Patient List';
			jQuery.alert({
				boxWidth: '300px',
				useBootstrap: false,
				type: 'red',
				title: 'Oh no!',
				content: 'There was a problem. Patient file download failed!'
			});
		});
	}
}

//Handler for the download link
i2b2.PatientListExporter.createResults = function() {
	//Determine what type of input was provided

	
	if(i2b2.PatientListExporter.model.prsRecord)
	{
		i2b2.PatientListExporter.createResultsForPrevQuery();
	}
	if(i2b2.PatientListExporter.folderKey){
		
		i2b2.PatientListExporter.createResultsForWorkplaceFolder();
	}
};

i2b2.PatientListExporter.downloadFile = function(nlst) {
	var numOfPatientsInFolder = 0;
	for (var i = 0; i < nlst.length; i++) {
		var s = nlst[i];
		var thisChildNodeType = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
		if(thisChildNodeType && (thisChildNodeType == 'PATIENT'))
			numOfPatientsInFolder ++;
	}

	if(numOfPatientsInFolder > 0)
	{
		jQuery.confirm({
			boxWidth: '400px',
			useBootstrap: false,
			type: 'blue',
			title: 'Confirm',
			content: 'Selected folder has ' + numOfPatientsInFolder + ' patients in it. Do you want to continue with the patient file download?',
			buttons: {
				yes: function () {
					var sUrl = i2b2["WORK"].cfg.cellURL;
					var domain = "domain=" + i2b2.PM.model.login_domain;
					var project = "&project=" + i2b2.PM.model.login_project;
					var userId = "&user_id=" + i2b2.PM.model.login_username;
					var session = "&session=" + i2b2.PM.model.login_password;
					var parentKey = "&parentKey=" + encodeURIComponent(i2b2.PatientListExporter.folderKey);
					var msgId = "&msgId=" + i2b2.h.GenerateAlphaNumId(20);
					var cellUrl = "&cell_url=" + encodeURIComponent(i2b2.WORK.cfg.cellURL) + "getChildren";
					var url = "js-i2b2/cells/plugins/ACT/PatientListExporter/PatientsListGenerator_FromFolder.php?"+ domain + project + userId + session + parentKey + msgId + cellUrl;
					jQuery.fileDownload(url)
					.done(function () { 
						jQuery.alert({
							boxWidth: '300px',
							useBootstrap: false,
							title: 'Success!',
							content: 'Patient file was successfully downloaded'
						});
					})
					.fail(function () { 
						jQuery.alert({
							boxWidth: '300px',
							useBootstrap: false,
							type: 'red',
							title: 'Oh no!',
							content: 'There was a problem. Patient file download failed!'
						});
					});
				},
				no: function () {}
			}
		});
	}
	else{
		jQuery.alert({
			boxWidth: '400px',
			useBootstrap: false,
			type: 'orange',
			title: 'Patient list can\'t be downloaded!',
			content: 'Selected workplace folder does not have any patients in it. Please make a different selection to proceed with patient file download.'
		});
	}
};

