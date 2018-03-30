/**
 * @projectDescription	lets user select or create new working folder.
 * @inherits	i2b2
 * @namespace	i2b2.PatientSetViewer
 * @author		 
 * @version 	1.4
 */

i2b2.PatientSetViewer.folderKey = null;
i2b2.PatientSetViewer.folderType = null;
i2b2.PatientSetViewer.PSVFolder = "PSV:Folder-created by ACTSHRINE Plug-in";
i2b2.PatientSetViewer.userRootFolderType = "USERROOT";

i2b2.PatientSetViewer.icons = $H({
	"PREV_QUERY": "js-i2b2/cells/CRC/assets/sdx_CRC_QM_workplace.jpg",
	"PATIENT_COLL": "js-i2b2/cells/CRC/assets/sdx_CRC_PRS.jpg",
	"ENCOUNTER_COLL": "js-i2b2/cells/CRC/assets/sdx_CRC_PRS.jpg",
	"PATIENT": "js-i2b2/cells/CRC/assets/sdx_CRC_PR.jpg",
	"PATIENT_COUNT_XML": "js-i2b2/cells/CRC/assets/sdx_CRC_PRC.jpg",
	"GROUP_TEMPLATE": "js-i2b2/cells/CRC/assets/sdx_CRC_QGDEF.jpg",
	"QUERY_DEFINITION": "js-i2b2/cells/CRC/assets/sdx_CRC_QDEF.jpg"
});

i2b2.PatientSetViewer.noChildren = $H();

i2b2.PatientSetViewer.Build = function () {

	i2b2.PatientSetViewer.LoadRootFolders();
};

i2b2.PatientSetViewer.Exit = function () {
	// purge old data
	i2b2.PatientSetViewer.folderKey = null;
	i2b2.PatientSetViewer.noChildren = $H();
	return true;
};

//Handler of the initial work folder tree loading
i2b2.PatientSetViewer.LoadRootFolders = function (refreshCall, uiCall) {
	try {
		var scopedCallback = new i2b2_scopedCallback();
		scopedCallback.scope = i2b2.WORK;
		scopedCallback.callback = function (results) {
			//Read the xml from the response
			var resXml = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
			var rootNodesCollection = [];

			for (var i = 0; i < resXml.length; i++) {
				var s = resXml[i];
				var nodeData = {};
				//next 4 data members are essential to jstree creation
				nodeData.id = i2b2.h.getXNodeVal(s, "index");
				nodeData.parent = "#";
				nodeData.text = i2b2.h.getXNodeVal(s, "name");
				nodeData.icon = "js-i2b2/cells/WORK/assets/WORK_root_exp.gif";
				nodeData.nodeType = i2b2.PatientSetViewer.userRootFolderType;

				rootNodesCollection.push(nodeData);

			}
			//Create the tree structure for workplace folders
			if (!refreshCall)  //This is initial load of the tree
			{
				function customMenu(node) {
					// The default set of all items
					var items = {
						"create": {
							"label": "New Folder",
							"action": function (obj) {

								///
								jQuery.confirm({
									title: 'Working Folder Name',
									boxWidth: '400px',
									useBootstrap: false,
									draggable: true,
									content: '' +
									'<form action="" class="formName" >' +
									'<div  class="form-group">' +
									'<label>New Folder Name</label>&nbsp;' +
									'<input type="text" style="width:300px;" class="name form-control" required />' +
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
												var position = 'inside';
												var parent = jQuery('#work_folders-tree').jstree('get_selected');

												var icon = "js-i2b2/cells/WORK/assets/WORK_folder_exp.gif";
												var folder = "FOLDER";
												var id = "TODO: get prj/idx";
												var newNode = { text: name, id: id, icon: icon, nodeType: folder };
												jQuery('#work_folders-tree').jstree().create_node(parent, newNode, "inside", function () {
													var newChildKey = i2b2.h.GenerateAlphaNumId(20);
													i2b2.PatientSetViewer.checkWorkplaceCartIndex("", parent, newChildKey)
													var varInput = {
														child_name: name,
														share_id: 'N',
														child_index: newChildKey,
														parent_key_value: i2b2.PatientSetViewer.workplaceRootIndex,
														child_visual_attributes: "FA",
														child_annotation: i2b2.PatientSetViewer.PSVFolder,
														child_work_type: "FOLDER",
														result_wait_time: 180
													};

													var scopedCallbackAdded = new i2b2_scopedCallback();
													scopedCallbackAdded.scope = i2b2.WORK;
													scopedCallbackAdded.callback = function (results) {
														i2b2.PatientSetViewer.LoadRootFolders(true, true);
														//jQuery('#work_folders-tree').jstree(true).refresh();
														i2b2.PatientSetViewer.refreshWorkspaceTree(i2b2.PatientSetViewer.workplaceRootIndex);

													};

													i2b2.WORK.ajax.addChild("WORK:Workplace", varInput, scopedCallbackAdded);


												});

											}
										},
										cancel: function () {

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


							},
						}
					};

					var correctNode = false;
					if (node.original.nodeType.indexOf('FOLDER') >= 0 || node.original.nodeType.indexOf(i2b2.PatientSetViewer.userRootFolderType) >= 0)
						correctNode = true;



					if (!node.original.nodeType || !correctNode) {
						delete items.create;
					}

					return items;
				}
				
				jQuery('#work_folders-tree').jstree({
					'core': {
						'check_callback': true,
						'data': rootNodesCollection
					},
					"plugins": ["contextmenu"],
					"contextmenu": {
						"items": customMenu
					}

				});

				jQuery('#work_folders-tree').bind(
								  "hover_node.jstree", function (evt, data){
								      if (data.node.original.nodeType && data.node.original.nodeType.indexOf('FOLDER') >= 0) {
									  jQuery(document.getElementById(data.node.id + '_anchor')).css("background","#c0f9cf");
									  jQuery(document.getElementById(data.node.id + '_anchor')).after('<span style="padding-left:15px;font-size:11px;">Click to select this folder</span>');
								      }
								  }

								  );

                                jQuery('#work_folders-tree').bind(
                                                                  "dehover_node.jstree", function (evt, data){
                                                                      if (data.node.original.nodeType && data.node.original.nodeType.indexOf('FOLDER') >= 0) {
									  jQuery(document.getElementById(data.node.id + '_anchor')).removeAttr("style");
                                                                          jQuery(document.getElementById(data.node.id + '_anchor')).nextAll('span').remove();
									      }
                                                                  }

                                                                  );


				jQuery('#work_folders-tree').bind(
					"select_node.jstree", function (evt, data) {
						var countSelected = data.selected.length;
						if (countSelected > 1) {
							for (var i = 0; i < countSelected; i++) {
								data.instance.deselect_node([data.selected[i]]);
							}
						}

						i2b2.PatientSetViewer.folderKey = data.node.id;
						i2b2.PatientSetViewer.folderType = data.node.original.nodeType;
						// && data.node.original.nodeType.indexOf(i2b2.PatientSetViewer.userRootFolderType) < 0
						if (data.node.original.nodeType && data.node.original.nodeType.indexOf('FOLDER') >= 0) {
							i2b2.PatientSetViewer.workingFolder = data.node.text;  /* This sets the working folder that will contain selected patients for the rest of this session.  */
							i2b2.PatientSetViewer.checkWorkplaceCartIndex("", data.node.parent, data.node.id);  /* update the cart index */

							$("PatientSetViewer-WRKDROP").innerHTML = '<img src="js-i2b2/cells/WORK/assets/WORK_folder_exp.gif" align="absbottom"/> ' + data.node.text + '&nbsp;<a href="#" onclick="javascript:i2b2.PatientSetViewer.wrkUnload();return false;"><img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/delete.png" title="Clear Selection" align="absbottom" border="0"/></a>';

							//							jQuery(".selectedFolder").html(data.node.text);
							
							//jQuery("#selected_folder").removeClass("hidden");


						}
						if (data.node.children.length <= 0)
							i2b2.PatientSetViewer.getResults();
					}
				);

				jQuery('#work_folders-tree').bind(
					"loaded.jstree", function (evt, data) {
						jQuery("#work_folders-tree").jstree("select_node", i2b2.PatientSetViewer.workplaceRootIndex);
					}
				);




			}
			else  //This is a refresh request
			{
				jQuery('#work_folders-tree').jstree(true).settings.core.data = rootNodesCollection;
				jQuery('#work_folders-tree').jstree(true).refresh();
				if (!uiCall)
					i2b2.PatientSetViewer.refreshWorkspaceTree(i2b2.PatientSetViewer.workplaceRootIndex);
			}
		};

		//Only manager should be able to see all the folders
		if (i2b2.PM.model.userRoles.indexOf("MANAGER") == -1) {
			i2b2.WORK.ajax.getFoldersByUserId("WORK:Workplace", {}, scopedCallback);
		} else {
			i2b2.WORK.ajax.getFoldersByProject("WORK:Workplace", {}, scopedCallback);
		}
	}
	catch (e) {
		console.error(e);
	}
};

//Handler for displaying chlid nodes tree for the selected parent
i2b2.PatientSetViewer.expandTree = function (nlst) {
	if (nlst.length > 0) {
		var position = 'inside';
		var parent = jQuery('#work_folders-tree').jstree('get_selected');
		for (var i = 0; i < nlst.length; i++) {
			var s = nlst[i];
			var id = i2b2.h.getXNodeVal(s, "index");
			var text = i2b2.h.getXNodeVal(s, "name");
			var typeOfFolder = i2b2.h.getXNodeVal(s, "work_xml_i2b2_type");
			if (typeOfFolder && i2b2.PatientSetViewer.icons.get(typeOfFolder))
				var icon = i2b2.PatientSetViewer.icons.get(typeOfFolder);
			else
				var icon = "js-i2b2/cells/WORK/assets/WORK_folder_exp.gif";

			var tt = i2b2.h.getXNodeVal(s, "tooltip");
			var ant = tt.split("\n")[1];


			var newNode = { text: text, id: id, icon: icon, nodeType: typeOfFolder };
			jQuery('#work_folders-tree').jstree(true).create_node(parent, newNode, "last", false, false);

		}
		jQuery("#work_folders-tree").jstree("open_node", "#" + parent);
	}
};

//Handler for fetching child nodes of parent folder
i2b2.PatientSetViewer.getResults = function () {

	// create callback display routine
	var scopedCallback = new i2b2_scopedCallback();
	scopedCallback.scope = i2b2.WORK;
	scopedCallback.callback = function (results) {
		var nlst = i2b2.h.XPath(results.refXML, "//folder[name and share_id and index and visual_attributes]");
		if (nlst.length <= 0)
			i2b2.PatientSetViewer.noChildren.set(i2b2.PatientSetViewer.folderKey, true);
		else {
			i2b2.PatientSetViewer.expandTree(nlst);
		}
	};
	//if (!i2b2.PatientSetViewer.noChildren.get(i2b2.PatientSetViewer.folderKey)) {
		// ajax communicator call
		var varInput = {
			parent_key_value: i2b2.PatientSetViewer.folderKey,
			result_wait_time: 180
		};
		i2b2.WORK.ajax.getChildren("WORK:Workplace", varInput, scopedCallback);
	//}
};





