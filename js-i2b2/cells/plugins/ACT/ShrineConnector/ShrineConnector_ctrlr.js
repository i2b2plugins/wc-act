/**
 * @project     Shrine Connector
 * @description JS Controller for Shrine Connector plugin
 * @inherits    i2b2
 * @namespace   i2b2.ShrineConnector
 * @author      Nich Wattanasin
 * @author      Jay Tarantino
 * @version     March 30, 2018
 * Copyright (c) 2006-2018 Massachusetts General Hospital
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the i2b2 Software License v2.1
 * which accompanies this distribution.
 *
 * ----------------------------------------------------------------------------------------
 */

i2b2.ShrineConnector.demoMode = false;

i2b2.ShrineConnector.UI = {};
i2b2.ShrineConnector.UI.flashId = '';
i2b2.ShrineConnector.UI.orginalBackgroundColor = '';
i2b2.ShrineConnector.UI.orginalColor = '';
i2b2.ShrineConnector.UI.IE8Mode = document.documentMode;
i2b2.ShrineConnector.UI.buttonStyle = "margin:3px; border-radius:8px; color:black; background-color:snow; font-family:helvetica;border-color:lightsteelblue; outline:none;";
i2b2.ShrineConnector.UI.showBckBtn = false;
i2b2.ShrineConnector.UI.working = false;
i2b2.ShrineConnector.ready = false;
i2b2.ShrineConnector.model.sites = {};
i2b2.ShrineConnector.WorkPlaceFolderName = "ACTSHRINEConnectorQueryNetworkIds";
i2b2.ShrineConnector.shrineQueryNetworkId = "";
i2b2.ShrineConnector.tableKey = "";
i2b2.ShrineConnector.reRunButtonText = "Rerun";
i2b2.ShrineConnector.OrginalRunButtonText = "";


i2b2.ShrineConnector.Init = function (loadedDiv) {

    if (i2b2.ShrineConnector.UI.IE8Mode && i2b2.ShrineConnector.UI.IE8Mode === 8)
        i2b2.ShrineConnector.UI.IE8Mode = true;
    else
        i2b2.ShrineConnector.UI.IE8Mode = false;

    i2b2.ShrineConnector.setWorkplaceRootIndex(i2b2.PM.model.login_username, true);

    BuildBackToPlugInButton();

    // 2.0 static variables
    i2b2.ShrineConnector.active = new Object();
    i2b2.ShrineConnector.model.prsRecord = false;
    i2b2.ShrineConnector.model.conceptRecord = false;
    i2b2.ShrineConnector.model.dirtyResultsData = true;
    i2b2.ShrineConnector.model.concepts = [];

    i2b2.ShrineConnector.model.firstVisit = true;
    i2b2.ShrineConnector.model.readyToPreview = false;
    i2b2.ShrineConnector.model.readyToProcess = false;
    i2b2.ShrineConnector.model.processLocked = false;

    // manage YUI tabs
    this.yuiTabs = new YAHOO.widget.TabView("ShrineConnector-TABS", { activeIndex: 0 });
    this.yuiTabs.on('activeTabChange', function (ev) {
        if (ev.newValue.get('id') == "ShrineConnector-TAB0") {
            // user switched to Shrine tab

            jQuery('#srcBtn').prop('disabled', false);
            jQuery('#srcBtn').prop('value', 'Search');
            jQuery("#workingSpan").hide();
            i2b2.ShrineConnector.ShrineSearch();
        }
    });

    z = $('anaPluginViewFrame').getHeight() - 34;
    $$('DIV#ShrineConnector-TABS DIV.ShrineConnector-MainContent')[0].style.height = z;
    $$('DIV#ShrineConnector-TABS DIV.ShrineConnector-MainContent')[1].style.height = z;

    jQuery('<div id="crcAlert" style="position: absolute;width: 375px;height: 50px;z-index: 1000;right:' +
        ' 0px;margin-right: -375px;margin-top: 25px;text-align: center;display: none;border: 2px solid #5398fb;background:' +
        ' white;border-radius: 10px;"><img src="js-i2b2/cells/plugins/ACT/ShrineConnector/assets/left.jpg" style="float: left;" />' +
        '<span id="crcAlertSpan" style="position: relative;top: 10px;"></span></div>').prependTo('#crcHistoryBox');


    jQuery('#srcBtn').prop('disabled', false);
    jQuery('#srcBtn').prop('value', 'Search');
    jQuery("#workingSpan").hide();

    jQuery('#ShrineAdmin-matchStr').on('keypress', function (event) {
        i2b2.ShrineConnector.TriggerClick(event);
    });
    jQuery('#ShrineAdmin-userId').on('keypress', function (event) {
        i2b2.ShrineConnector.TriggerClick(event);
    });

};

i2b2.ShrineConnector.ShrineSearch = function () {

    jQuery('#SiteTxt').val('');
    jQuery('#srcBtn').prop('disabled', true);
    jQuery("#workingSpan").show();

    var max_records = document.getElementById('ShrineAdmin-maxRecords').value;
    var match_str = jQuery.trim(document.getElementById('ShrineAdmin-matchStr').value);
    var user_id = jQuery.trim(document.getElementById('ShrineAdmin-userId').value);
    var search_category = 'top';

    if (document.getElementById('ShrineAdmin-onlyflagged').checked) {
        search_category = 'flagged';
    }

    if (user_id == '') {
        user_id = '@';
    }

    i2b2.ShrineConnector.shrineGetResults(max_records, match_str, user_id, search_category);

};


i2b2.ShrineConnector.Filter = function () {

    var siteFilter = jQuery.trim(jQuery('#SiteTxt').val().toUpperCase());
    var filterCount = 0;

    if (siteFilter)
        jQuery(".resultsTable tr:not(." + siteFilter + ", .header)").hide();
    else
        jQuery(".resultsTable tr").show();

    filterCount = jQuery('#ShrineConnector-ShrineResults tr:visible').length - 1;

};

i2b2.ShrineConnector.ResetForm = function () {

    jQuery('#SiteTxt').val('');
    jQuery('#ShrineAdmin-maxRecords').val('25');
    jQuery('#ShrineAdmin-matchStr').val('');
    jQuery('#ShrineAdmin-userId').val('');
    jQuery('#ShrineAdmin-onlyflagged').prop("checked", true);

    i2b2.ShrineConnector.ShrineSearch();

};

i2b2.ShrineConnector.TriggerClick = function (e) {

    //var e=event || window.event;
    var code = e.charCode || e.keyCode;

    if (code === 13) {
        switch (e.target.id) {
            case 'SiteTxt':
                i2b2.ShrineConnector.Filter();
                break;
            case 'ShrineAdmin-userId':
            case 'ShrineAdmin-matchStr':
                i2b2.ShrineConnector.ShrineSearch();
                break;
            default:
                break;
        }
    }

};

i2b2.ShrineConnector.shrineLoadResults = function () {

    jQuery('#srcBtn').prop('disabled', false);
    jQuery('#srcBtn').prop('value', 'Search');
    jQuery("#workingSpan").hide();

    var filterButton = '<input type="text" style="width:50px;" id="SiteTxt" value="" />' +
        '<button type="button" onclick="javascript:i2b2.ShrineConnector.Filter();return false;" title="Site Filter" ' +
        'style="' + i2b2.ShrineConnector.UI.buttonStyle + '">Filter</button>';



    var resultCounter = 0;
    var resultsHtml = "<table id='ShrineConnector-ShrineResults' class='resultsTable' cellspacing='0' style='table-layout:fixed;' >";


    resultsHtml += "<tr class='header'>" +
        "<th style='width:15px;border-top-style:none;padding:0px;'><img src=\"js-i2b2/cells/plugins/ACT/ShrineConnector/assets/flagged.png\" alt=\"Flagged\" title=\"Flagged\" /></th>" +
        "<th style='width:60px;border-top-style:none;'>Created</th>" +
        "<th style='width:200px;border-top-style:none; text-align:left;'>Name</th>" +
        "<th style='width:85px;border-top-style:none;'>Action</th>" +
        //"<th style='width:45px;border-top-style:none;'>Run</th>" + //removing Run for now 2/2018
        "<th style='width:40px;border-top-style:none;'>User ID</th>" +
        "<th style='width:55px;border-top-style:none;'>Group ID</th>" +
        "<th style='width:150px;border-top-style:none;text-align:left;min-width:150px;'>Flag Comment</th>" +
        "<th style='width:108px;border-top-style:none;'>Admin Note</th>" +
        "</tr>";

    for (var resultId in i2b2.ShrineConnector.model.previousQueries) {
        var query = i2b2.ShrineConnector.model.previousQueries[resultId];

        var dscrp = "";
        var sites = "";
        var trClass = "";


        var queryCreated = formatDateTime(query.created);
        //var queryName = formatQueryName(query.name);  //name formatting not needed at this time


        var viewIcon = "<a href='#' title=\"View Query in Query Tool\" onclick=\"javascript:i2b2.ShrineConnector.shrineGetQuery('" + query.id + "');return false;\">" +
            "<img src='js-i2b2/cells/ONT/assets/sdx_ONT_CONCPT_leaf.gif' alt='View Query in Query Tool' style='border:0;margin-left:8px;margin-right:2px;vertical-align:middle';></a>";
        var runIcon = '<img src="js-i2b2/cells/CRC/assets/sdx_CRC_QM.gif" style="border:0;">';

        var editTextButton = "<button class='" + resultCounter + "edtTxtBtn' style='float:right;" + i2b2.ShrineConnector.UI.buttonStyle + "' title='add or edit comment'" +
            " onclick='i2b2.ShrineConnector.editFlagCommentText(" + resultCounter + ",\"" + query.networkid + "\");' >+</button>";

        var flag = "";
        var FlagCheckBoxChecked = '<input id="' + resultCounter + 'ShrineAdmin-onlyflagged" type="checkbox" disabled="disabled" checked="checked" title="Flagged Query" onclick="i2b2.ShrineConnector.flagCheckboxClicked(' + resultCounter + ');"/>';
        var FlagCheckBoxUnChecked = '<input id="' + resultCounter + 'ShrineAdmin-onlyflagged" type="checkbox" disabled="disabled"  title="Unflagged Query" onclick="i2b2.ShrineConnector.flagCheckboxClicked(' + resultCounter + ');"/>';
        var flagIcon = "<img src=\"js-i2b2/cells/plugins/ACT/ShrineConnector/assets/flagged.png\" alt=\"Flagged for Acton Needed\" title=\"Flagged for Acton Needed\"/>";

        var showQuery = "javascript:i2b2.ShrineConnector.shrineGetQuery('" + query.id + "');return false;";
        var runQuery = "javascript:i2b2.ShrineConnector.shrineRunQuery('" + resultCounter + "','" + query.id + "','" + query.name + "','" + query.networkid + "')";

        var newProjectClick = "javascript:i2b2.ShrineConnector.CreateProject('" + query.id + "','" + query.name + "','" + query.networkid + "')";

        // A checkbox to control tracking of a completed local query is not needed at this time.
        var completedCheckBox = '<input id="isComplete' + query.networkid + '" type="checkbox" title="Was this query ran locally" onclick="i2b2.ShrineConnector.IsCompletedChecked(\'' + query.networkid + '\');"/>';

        var runButton = '<button id="isCompleteBtn' + query.networkid + '"  type="button" onclick="' + runQuery + '" title="Run SHRINE query locally" ' +
            'style="' + i2b2.ShrineConnector.UI.buttonStyle + '">Run</button>';

        var ViewButton = '<button id="VwBtn' + query.networkid + '"  type="button" onclick="' + showQuery + '" title="View &amp; Run SHRINE query locally" ' +
            'style="' + i2b2.ShrineConnector.UI.buttonStyle + '">View &amp; Run</button>';




        if (query.flagged.toLowerCase() == "true")
            flag = FlagCheckBoxChecked;
        else
            flag = FlagCheckBoxUnChecked;



        var desc = "";
        if (query.flagmessage)
            desc = query.flagmessage;

        desc = "<div style='width:100%;height:100%;margin:0;padding:0;overflow-x:hidden;overflow-y:auto;'>" + desc + "</div>";


        resultsHtml += "<tr id='resultsRow" + query.networkid + "' style='height:40px;' class='" + trClass + "'>" +
            "<td style='background-color:white;padding:0px;'>" + flag + "</td>" +
            "<td style='background-color:white;'>" + queryCreated + "</td>" +
            "<td style='text-align:left;background-color:white;white-space:normal;'>" + query.name + "</td>" +
            "<td style='background-color:white;padding-left:0px;'>" + ViewButton + "</td>" +
            //"<td style='background-color:white;padding:0px;'>" + runButton + "</td>" + // removeing run button for now 2/2018
            "<td style='background-color:white;word-wrap:break-word;' >" + query.userid + "</td>" +
            "<td style='background-color:white;word-wrap:break-word;'>" + query.group + "</td>" +
            "<td style='text-align:left;background-color:white;height:40px;min-width: 125px;'>" + desc + "</td>" +
            "<td style='text-align:right;background-color:white;'><span id='" + resultCounter + "EditTextSpan' class='" + query.networkid + "'></span>" + editTextButton + "</td>" +
            "</tr>";


        resultCounter++;

    }
    resultsHtml += "</table>";

    $('ShrineAdmin-results').innerHTML = resultsHtml;

    i2b2.ShrineConnector.loadCompletedQueries();

    jQuery('#resultsSpan').html(resultCounter);

    jQuery('#SiteTxt').on('keypress', function (event) {
        i2b2.ShrineConnector.TriggerClick(event);
    });




};


i2b2.ShrineConnector.flagCheckboxClicked = function (ui_row_id) {

    jQuery.alert({
        title: 'Alert',
        boxWidth: '300px',
        useBootstrap: false,
        content: 'Not Implemented',
    });

}

//Method to handle the click of the add/edit text button for a given row in the results table
i2b2.ShrineConnector.editFlagCommentText = function (ui_row_id, shrineQueryNetworkId) {

    var orginalText = jQuery("#" + ui_row_id + "EditTextSpan").text();
    var textBoxHTML = "<input id='" + ui_row_id + "edtTxt' class='" + ui_row_id + "commentElement' style='width:108px; type='text' value='" + orginalText + "' />";
    // staring to use multiline var textBoxHTML = "<textarea id='" + ui_row_id + "edtTxt' class='" + ui_row_id + "commentElement' type='text' value='" + orginalText + "' cols='40' rows='5' maxlengh='275' ></textarea>";
    var okBtnHTML = "<button class='" + ui_row_id + "commentElement' style='" + i2b2.ShrineConnector.UI.buttonStyle + "' title='Save Comments' onclick='i2b2.ShrineConnector.flagCommentOkClicked(" + ui_row_id + ",\"" + shrineQueryNetworkId + "\");' >Ok</button>";
    var cancelBtnHTML = "<button class='" + ui_row_id + "commentElement' style='" + i2b2.ShrineConnector.UI.buttonStyle + "' title='Cancel Changes' onclick='i2b2.ShrineConnector.flagCommentCancelClicked(" + ui_row_id + ");' >Cancel</button>";

    jQuery("#" + ui_row_id + "EditTextSpan").data("orginalValue", orginalText);

    var insertHTML = textBoxHTML + "</br>" + okBtnHTML + cancelBtnHTML;

    jQuery("." + ui_row_id + "edtTxtBtn").hide(500);

    jQuery("#" + ui_row_id + "EditTextSpan").html(insertHTML);



};


i2b2.ShrineConnector.flagCommentOkClicked = function (ui_row_id, shrineQueryNetworkId) {

    var adminNote = jQuery("#" + ui_row_id + "edtTxt").val();

    jQuery("#" + ui_row_id + "EditTextSpan").text(adminNote);
    jQuery("." + ui_row_id + "edtTxtBtn").show(500);
    jQuery("." + ui_row_id + "commentElement").remove();

    i2b2.ShrineConnector.saveNote(shrineQueryNetworkId, adminNote);

};

i2b2.ShrineConnector.flagCommentCancelClicked = function (ui_row_id) {

    jQuery("#" + ui_row_id + "EditTextSpan").text(jQuery("#" + ui_row_id + "EditTextSpan").data("orginalValue"));
    jQuery("." + ui_row_id + "edtTxtBtn").show(500);
    jQuery("." + ui_row_id + "commentElement").remove();


};




// function to create a Patient Set given a Previous Query's Query Master ID. 
// Reminder: query_master_id (local) = i2b2.PatientSetViewer.model.active.query.sdxInfo.sdxKeyValue (global)
i2b2.ShrineConnector.shrineRunQuery = function (ui_row_id, query_master_id, shrine_query_name, shrineQueryNetworkId) {


    if (i2b2.ShrineConnector.demoMode) {
        document.getElementById(ui_row_id + 'EditTextSpan').innerHTML = '<img src="js-i2b2/cells/plugins/ACT/ShrineConnector/assets/ajaxicon.gif" align="absmiddle"/> Processing';
        setTimeout(function () {
            document.getElementById(ui_row_id + 'EditTextSpan').innerHTML = "Query Created<br/><strong><a href=\"#\" onclick=\"$('ShrineConnector-TAB2').click();\">Proceed with this query &gt;</a></strong>";
        }, 5000);

    } else {

        if (i2b2.ShrineConnector.UI.working) {
            jQuery.alert({
                title: 'Working...',
                boxWidth: '300px',
                useBootstrap: false,
                content: 'Please wait, a query is running.',
            });


        }
        else {

            i2b2.ShrineConnector.UI.working = true;
            i2b2.ShrineConnector.shrineLoadQuery(query_master_id, shrine_query_name, ui_row_id, shrineQueryNetworkId);


        }

    }

};


function CreatePatientSetAJAXCall(params, ui_row_id) {
    var self = i2b2.CRC.ctrlr.currentQueryStatus;
    self = {};
    self.QM = {};
    self.QRS = {};
    self.QI = {};

    self.QM.name = "Create Patient Set Query";
    this.callbackQueryDef = new i2b2_scopedCallback();
    this.callbackQueryDef.scope = this;
    this.callbackQueryDef.callback = function (results) {
        // debug
        //jQuery("#PatientSetID").text("Create-Patient-Set query returned."); // the result_instance_id points to the patient set
        //jQuery("#PatientSetID").show();
        // end debug

        i2b2.ShrineConnector.UI.working = false;

        var queryName = "";

        var xml = jQuery.parseXML(results.msgResponse),
            $xml = jQuery(xml),
            $qn = $xml.find('query_master>name');

        queryName = $qn.text();

        var tabDiv = document.getElementById('crctabNavigate').children[0];


        if (results.error) // Check to see if there is a LOCKEDOUT message
        {
            var temp = results.refXML.getElementsByTagName('response_header')[0];
            if (undefined != temp) {
                results.errorMsg = i2b2.h.XPath(temp, 'descendant-or-self::result_status/status')[0].firstChild.nodeValue;
                if (results.errorMsg.substring(0, 9) == "LOCKEDOUT")
                    results.errorMsg = 'As an "obfuscated user" you have exceeded the allowed query repeat and are now LOCKED OUT, please notify your system administrator.';
            }
            jQuery.alert({
                title: 'Error',
                boxWidth: '300px',
                useBootstrap: false,
                content: 'For ' + queryName + ': ' + results.errorMsg,
            });
            ShowACTAlert(results.errorMsg);
            jQuery('#isCompleteBtn' + ui_row_id).html('Run');
            return;
        } else {
            // Check to see if there is an error
            var condition = results.refXML.getElementsByTagName('condition')[0];
            if (condition.getAttribute("type") == "ERROR") {
                results.errorMsg = 'ERROR: ' + condition.firstChild.nodeValue;
                jQuery.alert({
                    title: 'Error',
                    boxWidth: '300px',
                    useBootstrap: false,
                    content: results.errorMsg,
                });

                ShowACTAlert('Error');
                jQuery('#isCompleteBtn' + ui_row_id).html('Run');
                return;
            }
            var temp = results.refXML.getElementsByTagName('query_master')[0];
            self.QM.id = i2b2.h.getXNodeVal(temp, 'query_master_id');
            self.QM.name = i2b2.h.XPath(temp, 'descendant-or-self::name')[0].firstChild.nodeValue;
            // save the query instance
            var temp = results.refXML.getElementsByTagName('query_instance')[0];
            self.QI.id = i2b2.h.XPath(temp, 'descendant-or-self::query_instance_id')[0].firstChild.nodeValue;
            self.QI.status = i2b2.h.XPath(temp, 'descendant-or-self::query_status_type/name')[0].firstChild.nodeValue;
            self.QI.statusID = i2b2.h.XPath(temp, 'descendant-or-self::query_status_type/status_type_id')[0].firstChild.nodeValue;
            if (self.QI.status === "INCOMPLETE") // query is incomplete, placed on server queue. We poll to find out when it finishes.
            {
                ShowACTAlert('Patient Set Queued');
                jQuery.alert({
                    title: 'Queued',
                    boxWidth: '300px',
                    useBootstrap: false,
                    content: queryName + ' has timed out and has been rescheduled to run in the background.  \nThe results will appear in "Previous Queries".',
                });
                jQuery('#isCompleteBtn' + ui_row_id).html('Queued');
                SetQueryAsComplete();
                CRCAlert(tabDiv, 15, 500, 'A query has been queued for:<br/>' + queryName);
                i2b2.CRC.ctrlr.history.Refresh();

                //jQuery("#PatientSetID").text("Create-Patient-Set Query is Queued. Wait until polling starts..."); // the result_instance_id points to the patient set
                //jQuery("#PatientSetID").show();
                // check it once every 3 minutes = 180000 ms
                //i2b2.PatientSetViewer.pollForCreatePatientSetQueryCompletionHandler = setInterval(
                //                    function() { i2b2.PatientSetViewer.checkPatientSetQueryByID(self); }, 180000);
            } else {    // query is finished, we find the query instance and get the ID of the newly created Patient Set
                //alert('query is done!');                    

                SetQueryAsComplete();
                CRCAlert(tabDiv, 15, 500, 'A query has been created for:<br/>' + queryName);
                i2b2.CRC.ctrlr.history.Refresh();
            }
        }
    };

    function SetQueryAsComplete() {

        i2b2.ShrineConnector.saveQuery(i2b2.ShrineConnector.shrineQueryNetworkId);

        jQuery('#isCompleteBtn' + i2b2.ShrineConnector.shrineQueryNetworkId).html(i2b2.ShrineConnector.reRunButtonText);

    }


    // AJAX call to create patient set
    i2b2.CRC.ajax.runQueryInstance_fromQueryDefinition("Plugin:ShrineConnector", params, this.callbackQueryDef);

}


function UpdateCreatePatientSetCell(elementId, message) {
    document.getElementById(elementId).innerHTML = message;
    i2b2.CRC.ctrlr.history.Refresh();
}

function ShowACTAlert(message) {
    jQuery.alert({
        title: 'ACT Alert',
        boxWidth: '300px',
        useBootstrap: false,
        content: message,
    });
    i2b2.CRC.ctrlr.history.Refresh();
}



i2b2.ShrineConnector.shrineLoadQuery = function (query_master_id, shrine_query_name, ui_row_id, shrineQueryNetworkId) {
    //Need to load query to get the query items list so we can recreate the correct concepts etc.
    i2b2.ShrineConnector.shrineQueryNetworkId = shrineQueryNetworkId;
    var scopedCallback = new i2b2_scopedCallback();
    scopedCallback.scope = this;
    scopedCallback.callback = function (results) {
        var response = results.msgResponse;

        var queryError = i2b2.ShrineConnector.CheckStatusConditionForError(response)
        if (queryError) {
            jQuery('#isCompleteBtn' + shrineQueryNetworkId).html("Error");
            i2b2.ShrineConnector.UI.working = false;
            jQuery.alert({
                title: 'Error',
                boxWidth: '300px',
                useBootstrap: false,
                content: queryError,
            });
            return false;
        }

        var queryDef = "";

        //This will take the XML query_def... results from our first AJAX call and be added to the PARMS for the second AJAX call that creates the Patient Set
        queryDef = response.substring(response.indexOf("<request_xml>") + 13, response.lastIndexOf("</request_xml>"));
        queryDef = "<query_definition>" + queryDef.substring(queryDef.indexOf("<query_name>"), queryDef.lastIndexOf("</panel>")) + "</panel></query_definition>";

        var queryName = "Default Query Name";
        queryName = "(Shrine&gt;Local) " + shrine_query_name;
        i2b2.ShrineConnector.OrginalRunButtonText = jQuery('#isCompleteBtn' + shrineQueryNetworkId).html();

        jQuery.confirm({
            title: 'Local Query Name',
            boxWidth: '400px',
            useBootstrap: false,
            draggable: true,
            content: '' +
                '<form action="" class="formName" >' +
                '<div  class="form-group">' +
                '<label>Query Name</label>' +
                '<input type="text" value="' + queryName + '" style="width:300px;" class="name form-control" required />' +
                '</div>' +
                '</form>',
            buttons: {
                formSubmit: {
                    text: 'Submit',
                    btnClass: 'btn-blue',
                    action: function () {
                        var name = this.$content.find('.name').val();
                        if (!name) {
                            jQuery.alert({
                                title: 'Error',
                                boxWidth: '300px',
                                useBootstrap: false,
                                content: 'Please provide a valid query Name.',
                            });

                            return false;
                        }
                        queryName = name;
                        if (!queryName) {
                            i2b2.ShrineConnector.UI.working = false;
                            document.getElementById(ui_row_id + 'EditTextSpan').innerHTML = '';
                            return false;
                        }

                        //replace query name with our query name
                        var oldQueryName = queryDef.substring(queryDef.indexOf("<query_name>") + 12, queryDef.indexOf("</query_name>"));
                        queryDef = queryDef.replace("<query_name>" + oldQueryName, "<query_name>" + queryName);

                        // configure params to create XML for a query that contains only a previous query
                        var params = {};
                        params.psm_query_definition = queryDef;
                        params.psm_result_output = "<result_output_list>\n" +
                            "\t<result_output priority_index=\"12\" name=\"patient_count_xml\"/>\n" +
                            "</result_output_list>";
                        params.result_wait_time = 180;

                        jQuery('#isCompleteBtn' + shrineQueryNetworkId).html('Running');
                        CreatePatientSetAJAXCall(params, ui_row_id);
                    }
                },
                cancel: function () {
                    //close
                    jQuery('#isCompleteBtn' + shrineQueryNetworkId).html(i2b2.ShrineConnector.OrginalRunButtonText);
                    i2b2.ShrineConnector.UI.working = false;
                },
            },
            onContentReady: function () {
                // bind to events
                var jc = this;
                this.$content.find('form').on('submit', function (e) {
                    // if the user submits the form by pressing enter in the field.
                    e.preventDefault();
                    jc.$$formSubmit.trigger('click'); // reference the button and click it
                });
            }

        });





    };

    i2b2.CRC.ajax.getRequestXml_fromQueryMasterId("CRC:QueryTool", { qm_key_value: query_master_id }, scopedCallback);

};


i2b2.ShrineConnector.CheckStatusConditionForError = function (responseXml) {
    if (!responseXml)
        return "Error: Response from cell is null or empty, unable to parse";

    try {
        xmlDoc = jQuery.parseXML(responseXml);
        $xml = jQuery(xmlDoc);
        $cond = $xml.find('condition');
        if ($cond[0].attributes[0].value.toUpperCase() == "ERROR") {
            if ($cond[0].innerHTML) //For the IE8 users innerHTML is undef in IE8.  
                return $cond[0].innerHTML;
            else
                return "Unknown error.  Please check the message log.";
        }
        else
            return false;
    }
    catch (e) {
        return "Error parsing results: " + e;
    }
}



i2b2.ShrineConnector.shrineGetQuery = function (qm_id) {

    //need to check to see if actual query is error free, before we call the CRC doQueryload.  This way we don't leave the user is a state of confusion on a unloaded blank pannels

    var scopedCallbackGetQuery = new i2b2_scopedCallback();
    scopedCallbackGetQuery.scope = this;
    scopedCallbackGetQuery.callback = function (results) {
        var queryError = i2b2.ShrineConnector.CheckStatusConditionForError(results.msgResponse)
        if (queryError) {
            jQuery.alert({
                title: 'Error',
                boxWidth: '300px',
                useBootstrap: false,
                content: queryError,
            });
            return false;
        }
        else {
            if (i2b2.ShrineConnector.UI.IE8Mode)
                i2b2.ShrineConnector.UI.showBckBtn = true;

            jQuery('#bckBtn').show();
            i2b2.hive.MasterView.setViewMode('Patients');
            i2b2.CRC.ctrlr.QT.doQueryLoad(qm_id);
        }

    }


    i2b2.CRC.ajax.getRequestXml_fromQueryMasterId("CRC:QueryTool", { qm_key_value: qm_id }, scopedCallbackGetQuery);

};


i2b2.ShrineConnector.createPatientSet = function (query_master_id) {
    jQuery.alert({
        title: 'Alert',
        boxWidth: '300px',
        useBootstrap: false,
        content: query_master_id,
    });
};




function BackToPlugInWrapper() {
    i2b2.hive.MasterView.setViewMode('Analysis');
}

function BuildBackToPlugInButton() {
    if (!jQuery('#bckBtn').length) {
        jQuery('body').prepend('<button id="bckBtn" type="button"   title="Return to Shrine Connector" onclick="BackToPlugInWrapper();" ' +
        'style="margin-left:45%; margin-top: 21px; border:none; position: absolute; z-index:999; color:white; background-color:mediumpurple; font-weight:bold; ' +
        'font-family:arial,helvetica; font-size:17px; display:none;padding: 5px 3px;">Back to SHRINE Connector</button>');

    }


}


i2b2.ShrineConnector.shrineGetResults = function (max_records, match_str, shrine_user_id, shrine_category, type) {

    if (!i2b2.ShrineConnector.demoMode) {
        //prepare arguments for ajax call
		var domain = "domain=" + i2b2.PM.model.login_domain;
		var project = "&project=" + i2b2.PM.model.login_project;
		var userId = "&user_id=" + i2b2.PM.model.login_username;
		var session = "&session=" + i2b2.PM.model.login_password;
		var msgId = "&msgId=" + i2b2.h.GenerateAlphaNumId(20);
		var category = "&category=" + shrine_category;
		var max = "&max=" + max_records;
		var shrine_match_str = "&shrine_match_str=" + match_str;
		var shrine_user_id = "&shrine_user_id=" + shrine_user_id;
		var url = "js-i2b2/cells/plugins/ACT/ShrineConnector/ShrineConnector_QueryLoader.php?"+ domain + project + userId + session +  msgId + category + max + shrine_match_str + shrine_user_id;
		
		//Make the ajax call
		jQuery.ajax({
			url : url,
			dataType : 'json',
			type: "POST",
			success: function(data, textStatus, resObject)
			{
				try{
					if(data.length<=0)
					{
						var errorMsg = "js-i2b2/cells/plugins/ACT/ShrineConnector/ShrineConnector_QueryLoader.php returned null! ";
						i2b2.ShrineConnector.HandleQueryLoadErrors(errorMsg);
						return false;
					}
					else
					{
						var results = data[0];
						if(results.status.toLowerCase() == 'success')
						{
							i2b2.ShrineConnector.model.previousQueries = {};
							var l = results.model.length;
							if(l <= 0)
							{
								var errorMsg = "No Shrine queries could be found! ";
								i2b2.ShrineConnector.HandleQueryLoadErrors(errorMsg);
								return false;
							}
							else{
								for (var i = 0; i < l; i++) {
									var query = results.model[i];
									if (query.id != undefined) {
										i2b2.ShrineConnector.model.previousQueries[i] = query;
									}
								}
								
								i2b2.ShrineConnector.shrineLoadResults(type);
							}
						}
						else
						{
							//handle error
							var results = data[0];
							i2b2.ShrineConnector.HandleQueryLoadErrors(results.msg);
							return false;
						}
					}
				}
				catch(e)
				{
					//handle error
					i2b2.ShrineConnector.HandleQueryLoadErrors(e);
					return false;
				}
			},
			error: function (jqXHR, textStatus, errorThrown)
			{
				console.log('jqXHR:');
				console.log(jqXHR);
				console.log('textStatus:');
				console.log(textStatus);
				
				var errorMsg = errorThrown + ' : Unable to connect to SHRINE. Please check your ACT_config.php \n file in the web client folder for correct adminURL.';
				i2b2.ShrineConnector.HandleQueryLoadErrors(errorThrown);
				return false;

			}
		});
		//i2b2.SHRINE.ajax.getNameInfo("Plugin:ShrineConnector", { shrine_category: shrine_category, shrine_max_records: max_records, shrine_match_str: match_str, shrine_user_id: user_id }, scopedCallback);
    } else {
        i2b2.ShrineConnector.model.previousQueries = i2b2.ShrineConnector.demoPreviousQueries;
        i2b2.ShrineConnector.shrineLoadResults(type);
    }

};

i2b2.ShrineConnector.HandleQueryLoadErrors = function (errorThrown) {

	console.log('errorThrown:');
	console.log(errorThrown);
	
	

	jQuery.alert({
		title: 'Error',
		boxWidth: '300px',
		useBootstrap: false,
		content: errorThrown,
	});

	jQuery("#workingSpan").hide();
	jQuery("#searchDiv").html('<label style="color:red;">' + errorThrown + '</label>');
};

i2b2.ShrineConnector.Unload = function () {
    // purge old data
    i2b2.ShrineConnector.model = {};
    i2b2.ShrineConnector.model.prsRecord = false;
    i2b2.ShrineConnector.model.conceptRecord = false;
    i2b2.ShrineConnector.model.dirtyResultsData = true;
    try {
        i2b2.ShrineConnector.yuiPanel.destroy();
    } catch (e) {
    }
    return true;
};



i2b2.ShrineConnector.Resize = function () {
    //var h = parseInt( $('anaPluginViewFrame').style.height ) - 61 - 17;
    //$$("DIV#ShrineConnector-mainDiv DIV#ShrineConnector-TABS DIV.results-timelineBox")[0].style.height = h + 'px';
    z = $('anaPluginViewFrame').getHeight() - 34;
    $$('DIV#ShrineConnector-TABS DIV.ShrineConnector-MainContent')[0].style.height = z;
    $$('DIV#ShrineConnector-TABS DIV.ShrineConnector-MainContent')[1].style.height = z;

    if ((!i2b2.ShrineConnector.UI.showBckBtn && i2b2.ShrineConnector.UI.IE8Mode) || !i2b2.ShrineConnector.UI.IE8Mode) //the main web client runs in Enterprise mode, and this mode caused invoking of Resize on leaving of plugin
    {
        jQuery('#bckBtn').hide();
    }
    if (i2b2.ShrineConnector.UI.showBckBtn)
        i2b2.ShrineConnector.UI.showBckBtn = false;

};

i2b2.ShrineConnector.wasHidden = function () {
    try {
        i2b2.ShrineConnector.yuiPanel.destroy();
    } catch (e) {
    }
}

function formatDateTime(inTimestamp) {
    var ret = inTimestamp;

    try {
        var parts = inTimestamp.split('T');
        var dateparts = parts[0].split('-');

        ret = dateparts[1] + '/' + dateparts[2] + '/' + dateparts[0] + '</br>' + parts[1].substring(0, 5);
        return ret;
    } catch (e) {
        return ret;
    }
}

function formatQueryName(inQueryName) {
    var ret = inQueryName;

    try {
        var parts = inQueryName.split('@');
        ret = parts[0];
        return ret;
    } catch (e) {
        return ret;
    }
}

function CRCAlert(blinkElement, cycles, rate, message) {
    jQuery('#crcAlertSpan').html(message);
    jQuery('#crcAlert').show(500);
    flashElement(blinkElement, '#crcAlert', cycles, rate);
}

function flashElement(blinkElement, alertElement, cycles, rate) {

    //if plugin view is 'full screen' covring the previous query pannel
    if ((jQuery(window).width() - jQuery('#anaPluginViewBox').width()) < 40) {
        i2b2.PLUGINMGR.ctrlr.main.ZoomView();
    }

    //if previous histroy is not open, then open it, and share it's space

    if (!jQuery('#crcHistoryBox').is(':visible')) {
        i2b2.hive.MasterView.toggleZoomWindow("HISTORY");
        i2b2.hive.MasterView.toggleZoomWindow("HISTORY");

    }


    if (i2b2.ShrineConnector.UI.flashId)
        clearInterval(i2b2.ShrineConnector.UI.flashId);
    else {
        i2b2.ShrineConnector.UI.orginalBackgroundColor = blinkElement.style.backgroundColor;
        i2b2.ShrineConnector.UI.orginalColor = blinkElement.style.color;
    }
    i2b2.ShrineConnector.UI.flashId = setInterval(flash, rate);

    var i = 0;


    function flash() {

        if (i > (cycles - 1)) {
            blinkElement.style.backgroundColor = i2b2.ShrineConnector.UI.orginalBackgroundColor;
            blinkElement.style.color = i2b2.ShrineConnector.UI.orginalColor;
            clearInterval(i2b2.ShrineConnector.UI.flashId);
            jQuery(alertElement).hide(500);
        } else {
            i++;
            if (blinkElement.style.backgroundColor == 'yellow') {
                blinkElement.style.backgroundColor = i2b2.ShrineConnector.UI.orginalBackgroundColor;
                blinkElement.style.color = i2b2.ShrineConnector.UI.orginalColor;
            } else {
                blinkElement.style.backgroundColor = 'yellow';
                blinkElement.style.color = 'black';
            }
        }

    }


}

//These Methods below are here to handle the checking/adding of SHRINE Local Queries Folder in the users Workspace 
//This includes tracking of 'completed' local Queries and any admin comments.

i2b2.ShrineConnector.setWorkplaceRootIndex = function (user_id, refreshResults) {
    var scopedCallback = new i2b2_scopedCallback();
    scopedCallback.scope = i2b2.WORK;
    scopedCallback.callback = function (results) {
        var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
        for (var i = 0; i < nlst.length; i++) {
            var s = nlst[i];
            var folder_user_id = i2b2.h.getXNodeVal(s, "user_id");
            var folder_index = i2b2.h.getXNodeVal(s, "index");
            if (folder_user_id == user_id) {
                i2b2.ShrineConnector.workplaceRootIndex = folder_index;

                var getSetParentACTWPFolder = new i2b2_scopedCallback();
                getSetParentACTWPFolder.scope = i2b2.WORK;
                getSetParentACTWPFolder.callback = function (results) {
                    var cartFound = false;
                    var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
                    for (var i = 0; i < nlst.length; i++) {
                        var s = nlst[i];

                        //get table key
                        if (i === 0) {
                            var idx = i2b2.h.getXNodeVal(s, "index");
                            i2b2.ShrineConnector.tableKey = idx.split("\\")[2];
                        }


                        var folder_name = i2b2.h.getXNodeVal(s, "name");
                        var folder_index = i2b2.h.getXNodeVal(s, "index");
                        if (folder_name == i2b2.ShrineConnector.WorkPlaceFolderName) {
                            cartFound = true;
                            i2b2.ShrineConnector.workplaceCartIndex = folder_index;
                            break;
                        }
                    }
                    if (!cartFound) {
                        // ask to create folder ?
                        var newChildKey = i2b2.h.GenerateAlphaNumId(20);
                        var varInput = {
                            child_name: i2b2.ShrineConnector.WorkPlaceFolderName,
                            share_id: 'N',
                            child_index: newChildKey,
                            parent_key_value: i2b2.ShrineConnector.workplaceRootIndex,
                            child_visual_attributes: "FA",
                            child_annotation: "FOLDER:" + i2b2.ShrineConnector.WorkPlaceFolderName,
                            child_work_type: "FOLDER",
                            result_wait_time: 180
                        };
                        var addWSCallBack = new i2b2_scopedCallback();
                        addWSCallBack.scope = i2b2.WORK;
                        addWSCallBack.callback = function (results) {
                            if (results.error) {
                                jQuery("." + queryId).html("Error");
                                jQuery.alert({
                                    title: 'Error in create WP folder',
                                    boxWidth: '300px',
                                    useBootstrap: false,
                                    content: 'Error' + results.error,
                                });

                            }
                            else {
                                i2b2.ShrineConnector.setWorkplaceRootIndex(user_id, false);

                            }
                        }

                        i2b2.WORK.ajax.addChild("WORK:Workplace", varInput, addWSCallBack);


                    }

                    if (refreshResults)
                        i2b2.ShrineConnector.ShrineSearch();


                };

                var varInput = {
                    parent_key_value: i2b2.ShrineConnector.workplaceRootIndex,
                    result_wait_time: 180
                };
                i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, getSetParentACTWPFolder);

            }
        }
    };

    if (i2b2.PM.model.userRoles.indexOf("MANAGER") == -1) {
        i2b2.WORK.ajax.getFoldersByUserId("WORK:Workplace", {}, scopedCallback);
    } else {
        i2b2.WORK.ajax.getFoldersByProject("WORK:Workplace", {}, scopedCallback);
    }

};




i2b2.ShrineConnector.saveQuery = function (queryId) {
    i2b2.ShrineConnector.setWorkplaceRootIndex(i2b2.PM.model.login_username, true);
    if (!i2b2.ShrineConnector.workplaceCartIndex) {
        return;
    }

    if (!jQuery('#resultsRow' + i2b2.ShrineConnector.shrineQueryNetworkId).data("queryRan") && !jQuery('#resultsRow' + i2b2.ShrineConnector.shrineQueryNetworkId).data("adminNote")) {  /* avoid duplicate folders in the workplace */

        var encapXML = "";
        var encapWorkType = "";
        var encapValues = {};
        var encapTitle = "";
        var encapNoEscape = [];

        encapXML = i2b2.WORK.cfg.msgs.encapsulateQM;
        encapWorkType = "PREV_QUERY";
        encapValues.qm_id = queryId;
        encapValues.qm_name = queryId;
        encapTitle = encapValues.qm_name;

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
            parent_key_value: i2b2.ShrineConnector.workplaceCartIndex,
            share_id: 'N',
            child_visual_attributes: "ZA",
            child_annotation: newChildKey + "¿1¿", /*TODO:  Find current adminNote and keep that one */
            child_work_type: encapWorkType,
            child_work_xml: encapMsg,
            result_wait_time: 180
        };
        var scopedCallback = new i2b2_scopedCallback();
        scopedCallback.scope = i2b2.WORK;
        scopedCallback.callback = function (results) {
            if (results.error) {
                jQuery("." + queryId).html("Error");
                jQuery.alert({
                    title: 'Error',
                    boxWidth: '300px',
                    useBootstrap: false,
                    content: 'Error' + results.error,
                });

            }
            else {
                jQuery('#resultsRow' + queryId).data("queryRan", true);

                jQuery('#resultsRow' + queryId).data("folderIndex", newChildKey);
            }
        }
        i2b2.WORK.ajax.addChild("WORK:Workplace", varInput, scopedCallback);

    }

    else {
        var annotateCallBack = new i2b2_scopedCallback();
        annotateCallBack.scope = i2b2.WORK;
        annotateCallBack.callback = function (results) {
            if (results.error) {
                jQuery.alert({
                    title: 'Error',
                    boxWidth: '300px',
                    useBootstrap: false,
                    content: 'Error' + results.error,
                });
            }
            else {

                jQuery('#resultsRow' + queryId).data("queryRan", true);

            }
        }

        var annTxt = "";
        if (jQuery('#resultsRow' + queryId).data("adminNote")) {
            annTxt = jQuery('#resultsRow' + queryId).data("folderIndex") + "¿1¿" + jQuery("." + queryId).html();

        }
        else {
            annTxt = jQuery('#resultsRow' + queryId).data("folderIndex") + "¿1¿"
        }

        var varInput = {
            annotation_text: annTxt,
            annotation_target_id: "\\\\" + i2b2.ShrineConnector.tableKey + "\\" + jQuery('#resultsRow' + queryId).data("folderIndex"),
            result_wait_time: 180
        };

        i2b2.WORK.ajax.annotateChild("WORK:Workplace", varInput, annotateCallBack);

    }
};


i2b2.ShrineConnector.saveNote = function (queryId, adminNote) {
    i2b2.ShrineConnector.setWorkplaceRootIndex(i2b2.PM.model.login_username, false);
    if (!i2b2.ShrineConnector.workplaceCartIndex) {
        return;
    }


    if (!jQuery('#resultsRow' + queryId).data("folderIndex"))  /*if there not already a folder then added it, otherwise annoatte it. */ {
        var encapXML = "";
        var encapWorkType = "";
        var encapValues = {};
        var encapTitle = "";
        var encapNoEscape = [];

        encapXML = i2b2.WORK.cfg.msgs.encapsulateQM;
        encapWorkType = "PREV_QUERY";
        encapValues.qm_id = queryId;
        encapValues.qm_name = queryId;
        encapTitle = encapValues.qm_name;

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
            parent_key_value: i2b2.ShrineConnector.workplaceCartIndex,
            share_id: 'N',
            child_visual_attributes: "ZA",
            child_annotation: newChildKey + "¿¿" + adminNote,   /*TODO:  Find current status of queryRan and keep that one */
            child_work_type: encapWorkType,
            child_work_xml: encapMsg,
            result_wait_time: 180
        };
        var scopedCallback = new i2b2_scopedCallback();
        scopedCallback.scope = i2b2.WORK;
        scopedCallback.callback = function (results) {
            if (results.error) {
                jQuery("." + queryId).html("Error");
                jQuery.alert({
                    title: 'Alert',
                    boxWidth: '300px',
                    useBootstrap: false,
                    content: 'Error' + results.error,
                });

            }
            else {

                jQuery('#resultsRow' + queryId).data("adminNote", true);
                jQuery('#resultsRow' + queryId).data("folderIndex", newChildKey);

            }
        }
        i2b2.WORK.ajax.addChild("WORK:Workplace", varInput, scopedCallback);

    }
    else {
        var annotateCallBack = new i2b2_scopedCallback();
        annotateCallBack.scope = i2b2.WORK;
        annotateCallBack.callback = function (results) {
            if (results.error) {
                jQuery.alert({
                    title: 'Error',
                    boxWidth: '300px',
                    useBootstrap: false,
                    content: 'Error' + results.error,
                });
            }
            else {
                jQuery('#resultsRow' + queryId).data("adminNote", true);
            }
        }

        var annTxt = "";
        if (jQuery('#resultsRow' + queryId).data("queryRan")) {
            annTxt = jQuery('#resultsRow' + queryId).data("folderIndex") + "¿1¿" + adminNote

        }
        else {
            annTxt = jQuery('#resultsRow' + queryId).data("folderIndex") + "¿¿" + adminNote
        }



        var varInput = {
            annotation_text: annTxt,
            annotation_target_id: "\\\\" + i2b2.ShrineConnector.tableKey + "\\" + jQuery('#resultsRow' + queryId).data("folderIndex"),
            result_wait_time: 180
        };

        i2b2.WORK.ajax.annotateChild("WORK:Workplace", varInput, annotateCallBack);



    }
};





i2b2.ShrineConnector.removeQuery = function (queryId) {
    return;  /* Not Implemented */
    if (!i2b2.ShrineConnector.workplaceCartIndex) {
        jQuery('#isComplete' + folder_name).prop('checked', true);
        return;
    }
    var scopedCallbackCart = new i2b2_scopedCallback();
    scopedCallbackCart.scope = i2b2.WORK;
    scopedCallbackCart.callback = function (results) {
        var cartFound = false;
        var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
        for (var i = 0; i < nlst.length; i++) {
            var s = nlst[i];
            var folder_name = i2b2.h.getXNodeVal(s, "name");
            //Workaround The getXNodeVal is repeating the name twice.
            if (folder_name.length / 2 > 1) {
                folder_name = folder_name.substring(0, folder_name.length / 2);
            }
            var folder_index = i2b2.h.getXNodeVal(s, "index");
            var folder_type = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
            if (folder_name == queryId && folder_type == 'PREV_QUERY') {
                // delete child
                var scopedCallbackDelete = new i2b2_scopedCallback();
                scopedCallbackDelete.scope = i2b2.WORK;
                scopedCallbackDelete.callback = function (results) {
                    if (results.error) {
                        jQuery('#isComplete' + folder_name).prop('checked', true);
                        jQuery("." + folder_name).html("Error");
                        jQuery.alert({
                            title: 'Alert',
                            boxWidth: '300px',
                            useBootstrap: false,
                            content: 'Error' + results.error,
                        });
                    }
                    else {
                        jQuery("." + folder_name).html("Ready");
                    }

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
        parent_key_value: i2b2.ShrineConnector.workplaceCartIndex,
        result_wait_time: 180
    };

    i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);

};

i2b2.ShrineConnector.loadCompletedQueries = function () {
    var scopedCallbackCart = new i2b2_scopedCallback();
    scopedCallbackCart.scope = i2b2.WORK;
    scopedCallbackCart.callback = function (results) {
        var cartFound = false;
        var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
        for (var i = 0; i < nlst.length; i++) {
            var s = nlst[i];
            var folder_name = i2b2.h.getXNodeVal(s, "name");
            //Workaround The getXNodeVal is repeating the name twice.
            if (folder_name.length / 2 > 1) {
                folder_name = folder_name.substring(0, folder_name.length / 2);
            }
            var folder_type = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
            if (folder_type == 'PREV_QUERY') {
                var tt = i2b2.h.getXNodeVal(s, "tooltip");
                var ant = tt.split("\n")[1];
                var ACTInfo = ant.split("¿");
                if (ACTInfo[1]) //has query been ran flag
                {
                    jQuery('#isCompleteBtn' + folder_name).html(i2b2.ShrineConnector.reRunButtonText);
                    jQuery('#resultsRow' + folder_name).data("queryRan", true);
                    jQuery('#resultsRow' + folder_name).data("folderIndex", ACTInfo[0]);
                }
                else
                    jQuery('#resultsRow' + folder_name).data("queryRan", false);

                if (ACTInfo[2]) //are there admin notes
                {
                    jQuery("." + folder_name).html(ACTInfo[2]);
                    jQuery('#resultsRow' + folder_name).data("adminNote", true);
                    jQuery('#resultsRow' + folder_name).data("folderIndex", ACTInfo[0]);
                }
                else
                    jQuery('#resultsRow' + folder_name).data("adminNote", false);
            }
        }
    };

    var varInput = {
        parent_key_value: i2b2.ShrineConnector.workplaceCartIndex,
        result_wait_time: 180
    };
    i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);
};


i2b2.ShrineConnector.IsCompletedChecked = function (shrineQueryNetworkId) {

    return;  /* Not Implemented */

    if (jQuery('#isComplete' + shrineQueryNetworkId).prop('checked')) {
        i2b2.ShrineConnector.saveQuery(shrineQueryNetworkId);
    }
    else {
        i2b2.ShrineConnector.removeQuery(shrineQueryNetworkId);

    }


};

//Deletes all save queries from the workplace  not tied to the UI at this time. Will run from console
i2b2.ShrineConnector.resetWorkplaceFolder = function () {

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
            if (folder_name == i2b2.ShrineConnector.WorkPlaceFolderName && folder_type == 'FOLDER') {
                // delete child
                var scopedCallbackDelete = new i2b2_scopedCallback();
                scopedCallbackDelete.scope = i2b2.WORK;
                scopedCallbackDelete.callback = function (results) {
                    if (results.error) {
                        jQuery.alert({
                            title: 'Alert',
                            boxWidth: '300px',
                            useBootstrap: false,
                            content: 'Error' + results.error,
                        });
                    }

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
        parent_key_value: i2b2.ShrineConnector.workplaceRootIndex,
        result_wait_time: 180
    };
    i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallbackCart);
};
