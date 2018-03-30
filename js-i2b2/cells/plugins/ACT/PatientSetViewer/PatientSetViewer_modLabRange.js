/**
 * @projectDescription	(GUI-only) Controller for CRC Query Tool's Lab Values constraint dialog box.
 * @inherits 	i2b2.PatientSetViewer.view
 * @namespace	i2b2.PatientSetViewer.view.modalLabValues
 * @author		Nich Wattanasin
 * @version 	1.0
 * ----------------------------------------------------------------------------------------
 */

i2b2.PatientSetViewer.view.modalLabValues = {
	formdata: {},
	cfgTestInfo: {
		name: 'RND-TEST',
		flagType: 'NA',
		flags: [{name:'Abnormal', value:'A'},{name:'Normal', value:'@'}],
		valueValidate: {
			onlyPos: true,
			onlyInt: true,
			maxString: 0 
		},
		valueType: 'PosFloat',
		valueUnitsCurrent: 0, // index into Units[]
		valueUnits: {},
		rangeInfo: {},
		enumInfo: {}
	},

    // snm0
    //===================================================================================
    // Gets called when a click occurs on the value bar graphic and the operator and 
    // values are set.
    //
	updateValue: function(e) {
	    // The method is to embed the reference to the value label of the bar
	    // in the anchor of the href and then get it and extract the value and
	    // place it in the select drop down and text box.
	    try {
	        var targ; // href of bar item that was clicked
	        if (!e) var e = window.event;
	        if (e.target) targ = e.target;
	        else if (e.srcElement) targ = e.srcElement;
	        if (targ.nodeType == 3) // defeat Safari bug
	            targ = targ.parentNode;
	        // make href into a string and get the anchor of it
	        var sTarg = targ.toString();
	        var iTargAnchor = sTarg.lastIndexOf("#");
	        if (iTargAnchor < 0) return; // no anchor
	        var sTargAnchor = sTarg.substring(iTargAnchor + 1);
	        if (sTargAnchor.length <= 1) return; //no anchor
	        //alert(sTargAnchor);
	        var sTargNumber = $(sTargAnchor).innerHTML;
	        // after getting the bar label get the value and put it in the slots
	        if ((sTargAnchor == 'PSV_lblToxL') || (sTargAnchor == 'PSV_lblLofL') || (sTargAnchor == 'PSV_lblHofL')) {
	            $('PSV_mlvfrmOperator').selectedIndex = 1;
	            //$('mlvfrmOperator').value='LE';
	            i2b2.PatientSetViewer.view.modalLabValues.formdata.numericOperator = 'LE';
	            $('PSV_mlvfrmNumericValue').value = sTargNumber;
	        }
	        if ((sTargAnchor == 'PSV_lblToxH') || (sTargAnchor == 'PSV_lblLofH') || (sTargAnchor == 'PSV_lblHofH')) {
	            $('PSV_mlvfrmOperator').selectedIndex = 5;
	            i2b2.PatientSetViewer.view.modalLabValues.formdata.numericOperator = 'GE';
	            $('PSV_mlvfrmNumericValue').value = sTargNumber;
	        }
	    }
	    catch (eError) {
	        alert("Error: updateValue: " + eError.description);
	    }
	},
    // snm0	

	
// ================================================================================================== //
	show: function(queryPanelController, key, conceptObj, isModifier) {
	    var fd = i2b2.PatientSetViewer.view.modalLabValues.formdata;
		this.cpc = queryPanelController;
		i2b2.PatientSetViewer.view.modalLabValues.isModifier = isModifier;
		this.key = key;
		this.conceptObj = conceptObj; // = i2b2.PatientSetViewer.view.modalLabValues.conceptObj
		this.i2b2Data = conceptObj.sdxData;
		// Create SimpleDialog control
		if (!this.sd) {
		    this.sd = new YAHOO.widget.SimpleDialog("PSV_itemLabRange", {
				zindex: 700,
				width: "600px",
				fixedcenter: true,
				constraintoviewport: true,
				modal: true,
				buttons: [{
					text: "OK",
					isDefault: true,
					handler: 
						(function() {
						    var closure_qpi = i2b2.PatientSetViewer.view.modalLabValues.qpi;
							var closure_cpc = i2b2.PatientSetViewer.view.modalLabValues.cpc;
							var closure_key = i2b2.PatientSetViewer.view.modalLabValues.key;
							var closure_number = i2b2.PatientSetViewer.view.modalLabValues.itemNumber;
							// submit value(s)
							if (this.submit()) {
							    if (i2b2.PatientSetViewer.view.modalLabValues.isModifier) 
                                {
							        i2b2.PatientSetViewer.view.modalLabValues.conceptObj.valueRestriction = i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.ModValues;
                                } 
                                else 
                                {
							        i2b2.PatientSetViewer.view.modalLabValues.conceptObj.valueRestriction = i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.LabValues;
								}
								i2b2.PatientSetViewer.model.dirtyResultsData = true;
								// update the panel/query tool GUI
							    i2b2.PatientSetViewer.conceptsRender(); //update GUI
							    delete i2b2.PatientSetViewer.view.modalLabValues.isModifier;
							}
						})
					}, {
					text: "Cancel",
					handler: (function(){
						
						this.cancel();
					})			
				}]
			});
		    $('PSV_itemLabRange').show();
			this.sd.validate = this.ValidateSave;  // attach the validation function from this class
			this.sd.render(document.body);
			// register for actions upon the modal DOM elements
			YAHOO.util.Event.addListener("PSV_mlvfrmTypeNONE", "click", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmTypeFLAG", "click", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmTypeVALUE", "click", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmFlagValue", "change", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmEnumValue", "change", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmOperator", "change", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmDbOperator", "change", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmStringOperator", "change", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmUnits", "change", this.changeHandler);
			YAHOO.util.Event.addListener("PSV_mlvfrmStrValue", "keypress", (function(e) {
				// anonymous function
				if (e.keyCode==8 || e.keyCode==46) { return true; }
				var msl = i2b2.PatientSetViewer.view.modalLabValues.cfgTestInfo.valueValidate.maxString;
				if (!msl || this.value.length < msl) {
				    delete i2b2.PatientSetViewer.view.modalLabValues.formdata.lastValidStr;
					return true;
				} else {
				    if (!i2b2.PatientSetViewer.view.modalLabValues.formdata.lastValidStr) {
				        i2b2.PatientSetViewer.view.modalLabValues.formdata.lastValidStr = this.value;
					}
					return true;
				}
			
			}));
			YAHOO.util.Event.addListener("PSV_mlvfrmStrValue", "keyup", (function(e) {
				// anonymous function
			    if (i2b2.PatientSetViewer.view.modalLabValues.formdata.lastValidStr) {
			        this.value = i2b2.PatientSetViewer.view.modalLabValues.formdata.lastValidStr;
				}
			}));
			this.sd.hideEvent.subscribe(function(o) {
				// setTimeout(function() {panel.destroy();}, 0);
				var dm = i2b2.PatientSetViewer.view.modalLabValues.cfgTestInfo;
				if (dm.valueType) {
					if(dm.valueType=="GENOTYPE"){
						//Find if there are search parameters put in the panel
						var existingInput = false;
						// var selectedOption = jQuery('input:radio[name=frmgenoType]:checked').val();
						if(dm.searchByRsId)
						{
							var valueStr = $('PSV_frmEnterRSIDValue').value;
							if(valueStr && (valueStr.match("^rs")) && valueStr.length>=3)
								existingInput = true;
						}
						if(dm.searchByGeneName)
						{
							var valueStr = $('PSV_frmEnterGeneNameValue').value;
							if(valueStr && valueStr.length>0)
								existingInput = true;
						}
						if(!existingInput){
							alert("No search parameters have been provided, thus this concept is being removed.");
							i2b2.PatientSetViewer.sanitizeGenomicConcepts();
							//queryPanelController._deleteConcept(i2b2.PatientSetViewer.view.modalLabValues.htmlID,"GTPAutoDelete");
						}
						else
						{
							if(!i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.LabValues)
								queryPanelController._deleteConcept(i2b2.PatientSetViewer.view.modalLabValues.htmlID,"GTPAutoDelete");
						}
					}
				}
			});
		}
				
		try{	
			this.sd.configClose();
		}
		catch(e)
		{ 
			console.error(e);
		}
		//Read the concept code
		var conceptCode = null;
		try{
			var conceptCode = i2b2.h.getXNodeVal(conceptObj.sdxData.origData.xmlOrig, 'basecode');
		}
		catch(e)
		{
			console.error(e);
		}
		var mdnodes = i2b2.h.XPath(conceptObj.sdxData.origData.xmlOrig, 'descendant::metadataxml/ValueMetadata[Version]');
		if (mdnodes.length > 0) {
			this.cfgByMetadata(mdnodes[0],conceptCode);
		} else {
			// no LabValue configuration
			return false;
		}
		if (i2b2.PatientSetViewer.view.modalLabValues.isModifier) 
        {
			//if (!this.i2b2Data.ModValues && this.i2b2Data.origData.ModValues) 
			if (!this.conceptObj.valueRestriction && this.i2b2Data.origData.ModValues)
            {
				// copy server delivered Lab Values to our scope
				//this.i2b2Data.ModValues = this.i2b2Data.origData.ModValues;
			    this.conceptObj.valueRestriction = this.i2b2Data.origData.ModValues;
			}
			var tmpLab = this.conceptObj.valueRestriction;
		} 
        else 
        {	
			//if (!this.i2b2Data.LabValues && this.i2b2Data.origData.LabValues) 
		    if (!this.conceptObj.valueRestriction && this.i2b2Data.origData.LabValues)
            {
				// copy server delivered Lab Values to our scope
				//this.i2b2Data.LabValues = this.i2b2Data.origData.LabValues;
		        this.conceptObj.valueRestriction = this.i2b2Data.origData.LabValues;
			}
		    var tmpLab = this.conceptObj.valueRestriction;
		}
		// load any data already attached to the node
		if (tmpLab) {
			switch(tmpLab.MatchBy) {
				case "FLAG":
					fd.selectedType = "FLAG";
					$("PSV_mlvfrmTypeFLAG").checked = true;
					var tn = $("PSV_mlvfrmFlagValue");
					for (var i=0; i<tn.options.length; i++) {
						if (tn.options[i].value == tmpLab.ValueFlag) {
							tn.selectedIndex = i;
							fd.flagValue = i;
							break;
						}
					}
					break;
				case "VALUE":					
					fd.selectedType = "VALUE";
					$("PSV_mlvfrmTypeVALUE").checked = true;
					// select the correct numeric matching operator
					if (tmpLab.NumericOp) {
					    var tn = $("PSV_mlvfrmOperator");
						for (var i=0; i<tn.options.length; i++) {
							if (tn.options[i].value == tmpLab.NumericOp) {
								tn.selectedIndex = i;
								fd.numericOperator = tmpLab.NumericOp;
								break;
							}
						}
						// load the values if any
						if (tmpLab.Value)       { $('PSV_mlvfrmNumericValue').value = tmpLab.Value; }
						if (tmpLab.ValueHigh)   { $('PSV_mlvfrmNumericValueHigh').value = tmpLab.ValueHigh; }
						if (tmpLab.ValueLow)    { $('PSV_mlvfrmNumericValueLow').value = tmpLab.ValueLow; }
					}
					if (tmpLab.ValueString) {
						if(tmpLab.GeneralValueType && tmpLab.GeneralValueType!='GENOTYPE'){
							$('PSV_mlvfrmStrValue').value = tmpLab.ValueString;
							var tn = $("PSV_mlvfrmStringOperator");
							for (var i=0; i<tn.options.length; i++) {
								if (tn.options[i].value == tmpLab.StringOp) {
									tn.selectedIndex = i;
									fd.numericOperator = tmpLab.StringOp;
									break;
								}
							}
						}
						else    //Parse the existing input and populate ui for GENOTYPE concept
						{
							if(tmpLab.searchByRsId)
							{
								// document.getElementById("frmgenoTypeId").checked = true;
								var rsIdVal = tmpLab.ValueString;
								var allele = tmpLab.Allele;
								if(allele && allele != '')
								{
									var alleleList = allele.split('_');
									if(alleleList.length>=3)
										rsIdVal =  rsIdVal + " | " + alleleList[0] + " " + alleleList[1] + " " + alleleList[2];
								}
								if(tmpLab.Consequence)
								{
									rsIdVal =  rsIdVal + " | " + tmpLab.Consequence;
								}
								$('PSV_frmEnterRSIDValue').value = rsIdVal;
								if(tmpLab.Consequence && tmpLab.Consequence.length>0)
								{
									if(tmpLab.Consequence.indexOf("(")>=0)
										tmpLab.Consequence = tmpLab.Consequence.substring(1, tmpLab.Consequence.length-1);
									var concequenceList = tmpLab.Consequence.split("OR");
									var trimmedConcequences = [];
									concequenceList.each(function(item){
										trimmedConcequences.push(item.trim());
									});
									jQuery('#PSV_consequenceTypes').multipleSelect("setSelects", trimmedConcequences);
									// jQuery('#consequenceTypes').val(tmpLab.Consequence).change();
								}
							}
							if(tmpLab.searchByGeneName)
							{
								// document.getElementById("frmgenoTypeName").checked = true;
								$('PSV_frmEnterGeneNameValue').value = tmpLab.ValueString;
								//Handle consequence dropdown
								if(tmpLab.Consequence && tmpLab.Consequence.length>0)
								{
									if(tmpLab.Consequence.indexOf("(")>=0)
										tmpLab.Consequence = tmpLab.Consequence.substring(1, tmpLab.Consequence.length-1);
									var concequenceList = tmpLab.Consequence.split("OR");
									var trimmedConcequences = [];
									concequenceList.each(function(item){
										trimmedConcequences.push(item.trim());
									});
									jQuery('#PSV_consequenceTypes').multipleSelect("setSelects", trimmedConcequences);
									// jQuery('#consequenceTypes').val(tmpLab.Consequence).change();
								}
							}
							if(tmpLab.Zygosity && tmpLab.Zygosity.length>0)
							{
								jQuery('#PSV_zygosityTypes').val(tmpLab.Zygosity).change();
							}
						}
					}
					if (tmpLab.DbOp) {
					    var tn = $("PSV_mlvfrmDbOperator");
						tn.checked = true;
					}
					if (tmpLab.ValueEnum) 	{ 
					    var tn = $("PSV_mlvfrmEnumValue");
						for (var i=0; i<tn.options.length; i++) {
							if (tmpLab.ValueEnum.indexOf(tn.options[i].text) > -1) {
								tn.options[i].selected = true;
							} else {
								tn.options[i].selected = false;
							}
						}
					}
					break;
			}
		} else 
        {
		    // set the form to show value selection if available
		    $("PSV_mlvfrmTypeVALUE").checked = true;
		    fd.selectedType = 'VALUE';

			//fd.selectedType = "NONE";
			//$("mlvfrmTypeNONE").checked = true;
		}
		// show the form
		this.sd.show();
		this.Redraw();
	},
	
// ================================================================================================== //
	changeHandler: function(e) {
	    var dm = i2b2.PatientSetViewer.view.modalLabValues.cfgTestInfo;
		var fd = i2b2.PatientSetViewer.view.modalLabValues.formdata;
		if (fd.ignoreChanges) { return true; }
		// get the DOM node that fired the event
		var tn;
		if (e.target) {
			tn = e.target;
		} else {
			if (e.srcElement) tn = e.srcElement;
			if (tn.nodeType == 3) tn = tn.parentNode;
		}
		// process
		switch(tn.id) {
		    case "PSV_mlvfrmTypeNONE":
				fd.selectedType = 'NONE';
				break;
		    case "PSV_mlvfrmTypeFLAG":
				fd.selectedType = 'FLAG';
				break;
		    case "PSV_mlvfrmTypeVALUE":
				fd.selectedType = 'VALUE';
				break;
			case "PSV_frmgenoTypeId":
				fd.selectedType = 'VALUE';
				// Element.show($('ZygosityContainer'));
				// Element.show($('effectContainer'));
				// Element.show($('rEF_ALTContainer'));
				break;
			case "PSV_frmgenoTypeName":
				fd.selectedType = 'VALUE';
				// Element.show($('ZygosityContainer'));
				// Element.hide($('effectContainer'));
				// Element.hide($('rEF_ALTContainer'));
				break;
		    case "PSV_mlvfrmFlagValue":
				fd.flagValue = tn.options[tn.selectedIndex].value;
				break;
		    case "PSV_mlvfrmOperator":
				var i1 = $('mlvfrmUnits');
				fd.numericOperator = tn.options[tn.selectedIndex].value;
				fd.valueUnitsCurrent = i1.selectedIndex;
				break;
		    case "PSV_mlvfrmStringOperator":
				fd.stringOperator = tn.options[tn.selectedIndex].value;	
				break;
		    case "PSV_mlvfrmDbOperator":
				fd.dbOperator = tn.checked;	
				break;
		    case "PSV_mlvfrmEnumValue":
				fd.enumIndex = tn.selectedIndex;
				fd.enumValue = tn.options[fd.enumIndex].innerHTML;
				break;
		    case "PSV_mlvfrmUnits":
				
		        var u1 = $('PSV_mlvfrmUnits');
				// convert entered values
				var cvD = dm.valueUnits[fd.unitIndex].multFactor;
				var cvM = dm.valueUnits[u1.selectedIndex].multFactor;
				var lst = [$('PSV_mlvfrmNumericValue'), $('PSV_mlvfrmNumericValueLow'), $('PSV_mlvfrmNumericValueHigh')];
				/*
				for (var i=0;i<lst.length;i++) {
					try {
						var t2 = lst[i].value;
						var t = (parseFloat(lst[i].value) / cvD) * cvM;
						if (isNaN(t)) { t = '';	}
						lst[i].value = t;
					} catch(e) {}
				}
				*/
				// save the new Units
				fd.unitIndex = u1.selectedIndex;
				// message if selected Unit is excluded from use
				if (dm.valueUnits[u1.selectedIndex].excluded) {
				    Element.show($('PSV_mlvUnitExcluded'));
				    $('PSV_mlvfrmNumericValue').disabled = true;
				    $('PSV_mlvfrmNumericValueLow').disabled = true;
				    $('PSV_mlvfrmNumericValueHigh').disabled = true;
				} else {
				    Element.hide($('PSV_mlvUnitExcluded'));
				    $('PSV_mlvfrmNumericValue').disabled = false;
				    $('PSV_mlvfrmNumericValueLow').disabled = false;
				    $('PSV_mlvfrmNumericValueHigh').disabled = false;
				}	
				
				break;
			default:
				console.warn("onClick element was not captured for ID:"+tn.id)
		}
		tn.blur();
		// save the changes
		i2b2.PatientSetViewer.view.modalLabValues.formdata = fd;
		i2b2.PatientSetViewer.view.modalLabValues.Redraw();
	},
	
// ================================================================================================== //
	cfgByMetadata: function(refXML,conceptCode){
		// load and process the xml info
	    i2b2.PatientSetViewer.view.modalLabValues.formdata.ignoreChanges = true;
	    var dm = i2b2.PatientSetViewer.view.modalLabValues.cfgTestInfo;
	    var fd = i2b2.PatientSetViewer.view.modalLabValues.formdata;
		fd.selectedType= "NONE";
		

		// process flag info
		dm.flag = false;
		try { 
			var t = i2b2.h.getXNodeVal(refXML, 'Flagstouse'); 
			if (t) {
				if (t == "A") {
					dm.flagType = 'NA';
					dm.flags = [{name:'Normal', value:'@'},{name:'Abnormal', value:'A'}];
				} else if (t == "HL") {
					dm.flagType = 'HL';
					dm.flags = [{name:'Normal', value:'@'},{name:'High', value:'H'},{name:'Low', value:'L'}];
				} else {
					dm.flagType = false;
				}
			} else {
				dm.flagType = false;
			}

			// insert the flags into the range select control
			var sn = $('PSV_mlvfrmFlagValue');
			while( sn.hasChildNodes() ) { sn.removeChild( sn.lastChild ); }
			for (var i=0; i<dm.flags.length; i++) {
				// ONT options dropdown
				var sno = document.createElement('OPTION');
				sno.setAttribute('value', dm.flags[i].value);
				var snt = document.createTextNode(dm.flags[i].name);
				sno.appendChild(snt);
				sn.appendChild(sno);
			}
		} catch(e) { 
			var t = false;
			dm.flags = [];
		}
		// work with the data type
		dm.enumInfo = [];
		dm.valueUnits = [];
		try {
			var t = i2b2.h.getXNodeVal(refXML, 'DataType');
			switch(t) {
				case "PosFloat":
					dm.valueType = "POSFLOAT";
					dm.valueValidate.onlyPos = true;
					dm.valueValidate.onlyInt = false;
					dm.valueValidate.maxString = false; 
					break;
				case "PosInteger":
					dm.valueType = "POSINT";
					dm.valueValidate.onlyPos = true;
					dm.valueValidate.onlyInt = true;
					dm.valueValidate.maxString = false; 
					break;
				case "Float":
					dm.valueType = "FLOAT";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					dm.valueValidate.maxString = false; 
					break;
				case "Integer":
					dm.valueType = "INT";
					dm.valueValidate.onlyPos = true;
					dm.valueValidate.onlyInt = true;
					dm.valueValidate.maxString = false; 
					break;
				case "String":
					dm.valueType = "STR";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					// extract max string setting
					try {
						var t = refXML.getElementsByTagName('MaxStringLength')[0].firstChild.nodeValue;
						t = parseInt(t);
					} catch(e) { 
						var t = -1;
					}
					if (t > 0) {
						dm.valueValidate.maxString = t;
					} else {
						dm.valueValidate.maxString = false;
					}
					break;
				case "largestring":
					dm.valueType = "LRGSTR";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					// extract max string setting
					try {
						var t = refXML.getElementsByTagName('MaxStringLength')[0].firstChild.nodeValue;
						t = parseInt(t);
					} catch(e) { 
						var t = -1;
					}
					if (t > 0) {
						dm.valueValidate.maxString = t;
					} else {
						dm.valueValidate.maxString = false;
					}
					break;	
				case "GENOTYPE_GENE":
			    case "GENOTYPE_GENE_INDEL":
			    case "GENOTYPE_GENE_SNP": 
				case "GENOTYPE_RSID":
				case "GENOTYPE_RSID_INDEL":
				case "GENOTYPE_RSID_SNP":  //For Genotype metadata
					// dm.valueType = "GENOTYPE";
					// dm.geneType = conceptName;
					// dm.valueValidate.onlyPos = false;
					// dm.valueValidate.onlyInt = false;
					dm.valueType = "GENOTYPE";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					var dataType = t;
					var genotypeParams = dataType.split("_");
					if(genotypeParams && genotypeParams.length>1)
					{
						if(genotypeParams[1].toLowerCase().indexOf('rsid')>=0)
						{
							dm.searchByRsId = true;
							dm.searchByGeneName = false;
							dm.basecode = conceptCode;
						}
						else
						{
							dm.searchByRsId = false;
							dm.searchByGeneName = true;
						}
						if(genotypeParams.length==3)
						{
							dm.geneType = genotypeParams[2];
						}
					}
					break;					
				case "Enum":
					dm.valueType = "ENUM";
					dm.valueValidate.onlyPos = false;
					dm.valueValidate.onlyInt = false;
					dm.valueValidate.maxString = false;
					// extract the enum data
					var t1 = i2b2.h.XPath(refXML,"descendant::EnumValues/Val");
					//var t = i2b2.h.XPath(refXML,"descendant::EnumValues/Val/text()");
					//var t2 = [];
					var sn = $('PSV_mlvfrmEnumValue');
					// clear the drop down
					while( sn.hasChildNodes() ) { sn.removeChild( sn.lastChild ); }			
					
					var t2 = new Array();
					for (var i=0; i<t1.length; i++) {
						if (t1[i].attributes[0].nodeValue != "" ) {
							//t2.push(t[i].attributes[0].nodeValue);
							var name = t1[i].attributes[0].nodeValue;
						} else {
							//t2.push(t[i].childNodes[0].nodeValue);
							var name = t1[i].childNodes[0].nodeValue;
						}
						t2[(t1[i].childNodes[0].nodeValue)] = name;
						

						var sno = document.createElement('OPTION');
						sno.setAttribute('value', (t1[i].childNodes[0].nodeValue));
						var snt = document.createTextNode(name);
						sno.appendChild(snt);
						sn.appendChild(sno);
							
					}
					dm.enumInfo = t2;

					// remove any Enums found in <CommentsDeterminingExclusion> section
					
					var t = i2b2.h.XPath(refXML,"descendant::CommentsDeterminingExclusion/Com/text()");
					var t2 = [];
					for (var i=0; i<t.length; i++) {
						t2.push(t[i].nodeValue);
					}
					t = t2.uniq();
					if (t.length > 0) {
						for (var i=0;i<t.length; i++){
							for (var i2=0;i2<dm.enumInfo.length; i2++) {
								if (dm.enumInfo[i2].indexOf(t[i]) > -1 ) {
									dm.enumInfo[i2] = null;
								}
							}
							// clean up the array
							dm.enumInfo = dm.enumInfo.compact();
						}
					}
					// clear & populate the Enum dropdown
					// populate values
					var count = 0;
					//for (var i in dm.enumInfo) {
					
					/*for (var i in dm.enumInfo) {
					//for (var i=0; i<dm.enumInfo.length; i++) {
						var sno = document.createElement('OPTION');
						sno.setAttribute('value', i);
						var snt = document.createTextNode(dm.enumInfo[i]);
						sno.appendChild(snt);
						sn.appendChild(sno);
						count ++;
						//mm  if (count == t1.length) {break;}
					}*/
					break;
				default:
					dm.valueType = false;
			}
		} catch(e) {
			dm.valueType = false;
			dm.valueValidate.onlyPos = false;
			dm.valueValidate.onlyInt = false;
			dm.valueValidate.maxString = false; 
			$('PSV_mlvfrmTypeVALUE').parentNode.hide();
		}
	
		// set the title bar (TestName and TestID are assumed to be mandatory)
		// this.sd.setHeader("Choose value of "+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")");
		this.sd.setHeader("Choose value of <span title='"+i2b2.h.getXNodeVal(refXML, 'TestName')+" (Test:"+i2b2.h.getXNodeVal(refXML, 'TestID')+")'>"+i2b2.h.getXNodeVal(refXML, 'TestName'));
	
		$('PSV_mlvfrmTypeNONE').nextSibling.nodeValue = "No Value";
		$('PSV_mlvfrmTypeFLAG').nextSibling.nodeValue = "By Flag"; // snm0
		$('PSV_mlvfrmTypeVALUE').nextSibling.nodeValue = "By Value";
	
		if (dm.valueType == "LRGSTR") {
		    $('PSV_valueContraintText').innerHTML = "You are allowed to search within the narrative text associated with the term " + i2b2.h.getXNodeVal(refXML, 'TestName');
			this.sd.setHeader("Search within the "+i2b2.h.getXNodeVal(refXML, 'TestName'));
			$('PSV_mlvfrmTypeNONE').nextSibling.nodeValue = "No Search Requested";
			$('PSV_mlvfrmTypeVALUE').nextSibling.nodeValue = "Search within Text";
		}else if (dm.valueType == "GENOTYPE") {
			if(dm.searchByRsId)
				$('PSV_valueContraintText').innerHTML = "Please use the RS identifier to specify the variant for which you would like to search.  When you begin typing in the search box below, a selection list will appear after you type the first three numbers.";
			else if(dm.searchByGeneName)
				$('PSV_valueContraintText').innerHTML = "Please use the gene name to specify the variant for which you would like to search.  When you begin typing in the search box below, a selection list will appear after you type the first characters.";
			else
				$('PSV_valueContraintText').innerHTML = "Please use the following input type to search Genomics data.  When you begin typing in the search box below, a selection list will appear after you type the first three characters.";
				
			jQuery("#PSV_valueContraintText").addClass('genotypeHeading');
			this.sd.setHeader("Search by "+i2b2.h.getXNodeVal(refXML, 'TestName'));
			// $('mlvfrmTypeNONE').nextSibling.nodeValue = "No Search Requested";
			// $('mlvfrmTypeVALUE').nextSibling.nodeValue = "Search within Text";

		} 
        else if (i2b2.PatientSetViewer.view.modalLabValues.isModifier) 
        {
		    $('PSV_valueContraintText').innerHTML = "Searches by Modifier values can be constrained by either a flag set by the sourcesystem or by the values themselves.";
		}
        else
        {
            //$('PSV_valueContraintText').innerHTML = "Searches by Lab values can be constrained by the high/low flag set by the performing laboratory, or by the values themselves.";
			 $('PSV_valueContraintText').innerHTML = "Searches can be constrained by the value itself or by the high/low flag set for the value (where applicable).";
		}
	
		// extract and populate unit info for all dropdowns
		var tProcessing = new Hash();
		try {
			// save list of all possible units (from)
			var t = i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::text()[parent::NormalUnits or parent::EqualUnits or parent::Units]");
			var t2 = [];
			for (var i=0; i<t.length; i++) 
            {
				t2.push(t[i].nodeValue);
			}
			t = t2.uniq();
			for (var i=0;i<t.length;i++) {
				var d = {name: t[i]};
				// is unit excluded?
				//if (i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::ExcludingUnits[text()='"+t[i]+"']").length>0) {
				//	d.excluded = true;
				//}
				
				// Equal Units
				//if (i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::ExcludingUnits[text()='"+t[i]+"']").length>0) {
				//	d.excluded = true;
				//}
				
				// does unit require conversion?
				try {
					d.multFactor = i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::ConvertingUnits[Units/text()='"+t[i]+"']/MultiplyingFactor/text()")[0].nodeValue;
				} catch(e) {
					d.multFactor = 1;
				}
				tProcessing.set(t[i], d);
			}
			// get our master unit (the first NormalUnits encountered that is not disabled)
			var t = i2b2.h.XPath(refXML,"descendant::UnitValues/descendant::NormalUnits/text()");
			var t2 = [];
			for (var i=0; i<t.length; i++) {
				t2.push(t[i].nodeValue);
			}
			t = t2.uniq();
			var masterUnit = false;
			for (var i=0;i<t.length;i++) 
            {
				var d = tProcessing.get(t[i]);
				if (!d.excluded && d.multFactor==1) 
                {
					masterUnit = t[i];
					d.masterUnit = true;
					tProcessing.set(t[i], d);
					break;
				}
			}
			if (!masterUnit) 
            {
				masterUnit = t[0];
				if (masterUnit) 
                {
					var d = tProcessing.get(masterUnit);
					d.masterUnit = true;
					d.masterUnitViolation = true;
					tProcessing.set(masterUnit, d);
				}
			}
		} 
        catch(e) 
        { 
			console.error("Problem was encountered when processing given Units");
		}

		dm.valueUnits = tProcessing.values();

		// update the unit drop downs
		var ud = [$('PSV_mlvfrmUnits')];
		for (var cud=0; cud < ud.length; cud++) {
			var sn = ud[cud];
			// clear the drop down
			while( sn.hasChildNodes() ) { sn.removeChild( sn.lastChild ); }			
			// populate values
			for (var i=0; i<dm.valueUnits.length; i++) {
				var sno = document.createElement('OPTION');
				sno.setAttribute('value', i);
				if (dm.valueUnits[i].masterUnit) { sno.setAttribute('selected', true); }				
				var snt = document.createTextNode(dm.valueUnits[i].name);
				sno.appendChild(snt);
				sn.appendChild(sno);
			}
		}
		// hide or show DIV
		if (dm.valueUnits.length==0) {
		    Element.hide($('PSV_mlvfrmUnitsContainer'));
		}
        else 
        {
			// message if selected Unit is excluded from use
			if (dm.valueUnits[ud[0].options[ud[0].selectedIndex].value].excluded) 
            {
			    Element.show($('PSV_mlvUnitExcluded'));
			    $('PSV_mlvfrmNumericValue').disabled = true;
			    $('PSV_mlvfrmNumericValueLow').disabled = true;
			    $('PSV_mlvfrmNumericValueHigh').disabled = true;
			} 
            else 
            {
			    Element.hide($('PSV_mlvUnitExcluded'));
			    $('PSV_mlvfrmNumericValue').disabled = false;
			    $('PSV_mlvfrmNumericValueLow').disabled = false;
			    $('PSV_mlvfrmNumericValueHigh').disabled = false;
			}
			Element.show($('PSV_mlvfrmUnitsContainer'));
		}



		
		// Extract the value range info and display it on the range bar
		dm.rangeInfo = {};
		try {
			dm.rangeInfo.LowOfLow = parseFloat(refXML.getElementsByTagName('LowofLowValue')[0].firstChild.nodeValue);
			$('PSV_mlvfrmGrpLowOfLow').innerHTML = dm.rangeInfo.LowOfLow;
		} catch(e) {}
		try {
			dm.rangeInfo.HighOfLow = parseFloat(refXML.getElementsByTagName('HighofLowValue')[0].firstChild.nodeValue);		
			$('PSV_mlvfrmGrpHighOfLow').innerHTML = dm.rangeInfo.HighOfLow;
		} catch(e) {}
		try {
			dm.rangeInfo.LowOfHigh = parseFloat(refXML.getElementsByTagName('LowofHighValue')[0].firstChild.nodeValue);
			$('PSV_mlvfrmGrpLowOfHigh').innerHTML = dm.rangeInfo.LowOfHigh;
		} catch(e) {}
		try {
			dm.rangeInfo.HighOfHigh = parseFloat(refXML.getElementsByTagName('HighofHighValue')[0].firstChild.nodeValue);
			$('PSV_mlvfrmGrpHighOfHigh').innerHTML = dm.rangeInfo.HighOfHigh;
			$('PSV_mlvfrmGrpMiddle').innerHTML = dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfLow;
			$('PSV_mlvfrmGrpMiddle').style.width = (((520 / (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfLow)) * (dm.rangeInfo.LowOfHigh - dm.rangeInfo.HighOfLow)) - 35) + "px";
			
			
			$('PSV_mlvfrmGrpLowOfLow').style.width = ((520 / (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfLow)) * (dm.rangeInfo.HighOfLow - dm.rangeInfo.LowOfLow)) + "px";
			$('PSV_mlvfrmGrpHighOfHigh').style.width = ((520 / (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfLow)) * (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfHigh)) + "px";
			
			$('PSV_mlvfrmGrpLow').style.width = ((520 / (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfLow)) * (dm.rangeInfo.HighOfLow - dm.rangeInfo.LowOfLow)) + "px";
			$('PSV_mlvfrmGrpHigh').style.width = ((520 / (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfLow)) * (dm.rangeInfo.HighOfHigh - dm.rangeInfo.LowOfHigh)) + "px";
			
		} catch(e) {}
		try {
			dm.rangeInfo.LowOfToxic = parseFloat(refXML.getElementsByTagName('LowOfToxic')[0].firstChild.nodeValue);
		} catch(e) {}
		try {
			dm.rangeInfo.LowOfLowValue = parseFloat(refXML.getElementsByTagName('HighOfToxic')[0].firstChild.nodeValue);
		} catch(e) {}
		
		// clear the data input elements
		$('PSV_mlvfrmTypeNONE').checked = true;
		$('PSV_mlvfrmFLAG').hide();
		$('PSV_mlvfrmVALUE').hide();
		$('PSV_mlvfrmOperator').selectedIndex = 0;
		$('PSV_mlvfrmStringOperator').selectedIndex = 0;
		$('PSV_mlvfrmFlagValue').selectedIndex = 0;
		$('PSV_mlvfrmNumericValueLow').value = '';
		$('PSV_mlvfrmNumericValueHigh').value = '';
		$('PSV_mlvfrmNumericValue').value = '';
		$('PSV_mlvfrmStrValue').value = '';
		$('PSV_frmEnterRSIDValue').value = 'rs';
		var readOnlyLength = 2;

		jQuery('#PSV_frmEnterRSIDValue').on('keypress, keydown', function(event) {
			if ((event.which != 37 && (event.which != 39))
				&& ((this.selectionStart < readOnlyLength)
				|| ((this.selectionStart == readOnlyLength) && (event.which == 8)))) {
				if(i2b2.PatientSetViewer.view.modalLabValues.isTextSelected(document.getElementById('PSV_frmEnterRSIDValue')))
				{
					$('PSV_frmEnterRSIDValue').value = 'rs';
					return false;
				}
				else
					return false;
			}
		});
		$('PSV_frmEnterGeneNameValue').value = '';
		$('PSV_mlvfrmDbOperator').checked = false;
		$('PSV_mlvfrmEnumValue').selectedIndex = 0;
		//$('PSV_zygosityTypes').selectedIndex = 0;
		jQuery("#PSV_zygosityTypes").multipleSelect({
            placeholder: "Please make a selection",
			maxHeight: 80
        });
		jQuery("#PSV_zygosityTypes").multipleSelect("uncheckAll");
		//$('PSV_consequenceTypes').selectedIndex = 0;
		
		jQuery("#PSV_consequenceTypes").multipleSelect({
            placeholder: "Please make a selection",
            maxHeight: 100
        });
		jQuery("#PSV_consequenceTypes").multipleSelect("uncheckAll");
		
		// save the initial values into the data model
		var tn = $("PSV_mlvfrmOperator");
		fd.numericOperator = tn.options[tn.selectedIndex].value;
		var tn = $("PSV_mlvfrmStringOperator");
		fd.stringOperator = tn.options[tn.selectedIndex].value;		
		var tn = $("PSV_mlvfrmOperator");
		fd.flagValue = tn.options[tn.selectedIndex].value;
		fd.unitIndex = $('PSV_mlvfrmUnits').selectedIndex;
		fd.dbOperator = $("PSV_mlvfrmDbOperator").checked;
		i2b2.PatientSetViewer.view.modalLabValues.formdata.ignoreChanges = false;
		i2b2.PatientSetViewer.view.modalLabValues.setUnits();
		i2b2.PatientSetViewer.view.modalLabValues.Redraw();
	},
	
// ================================================================================================== //
	setUnits: function(newUnitIndex) {
		// this function is used to change all the dropdowns and convert the range values
		if (!newUnitIndex) { newUnitIndex = this.formdata.unitIndex; }
		if (newUnitIndex==-1) { return; }
		var dm = this.cfgTestInfo;
		var ri = this.cfgTestInfo.rangeInfo;
		var cv = dm.valueUnits[newUnitIndex].multFactor;
		var t;
		var el;
		$('PSV_mlvfrmLblUnits').innerHTML = dm.valueUnits[newUnitIndex].name;
		try {
			t = dm.rangeInfo.LowOfLow * cv;
		} catch(e) {}
		try {
			t = dm.rangeInfo.HighOfLow * cv;
			if (isNaN(t)) { t = '';	}
			el = $("PSV_mlvfrmLblHighOfLow");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
		try {
			t = dm.rangeInfo.LowOfHigh * cv;
			if (isNaN(t)) { t = '';	}
			el = $("PSV_mlvfrmLblLowOfHigh");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
		try {
			t = dm.rangeInfo.HighOfHigh * cv;
		} catch(e) {}
		try {
			t = dm.rangeInfo.LowOfToxic * cv;
			if (isNaN(t)) { t = '';	}
			el = $("PSV_mlvfrmLblLowToxic");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
		try {
			t = dm.rangeInfo.LowOfLowValue * cv;
			if (isNaN(t)) { t = '';	}
			el = $("PSV_mlvfrmLblHighToxic");
			el.innerHTML = t;
			el.style.left = (Element.getWidth(el)/ 2);
		} catch(e) {}
	},
	
// ================================================================================================== //
	Redraw: function(){
		if (i2b2.PatientSetViewer.view.modalLabValues.formdata.ignoreChanges) return;
		i2b2.PatientSetViewer.view.modalLabValues.formdata.ignoreChanges = true;
		var fd = i2b2.PatientSetViewer.view.modalLabValues.formdata;
		var dm = i2b2.PatientSetViewer.view.modalLabValues.cfgTestInfo;
		// hide show radios according to configuration
		if (dm.valueType) {
			if(dm.valueType=="GENOTYPE")
			{
				Element.hide($('PSV_mlvfrmTypeNONE').parentNode);
				Element.hide($('PSV_mlvfrmTypeFLAG').parentNode);
				Element.hide($('PSV_mlvfrmTypeVALUE').parentNode);
				// Element.show($('frmgenoTypeId').parentNode);
				// Element.show($('frmgenoTypeName').parentNode);
				
				// jQuery("#AlleleTypes").prop("disabled", false);
				// jQuery("#AlleleTypes").children('option').show();
				// jQuery("#AlleleTypes option[value='']").attr('selected',true);
			}
			else
			{
				Element.show($('PSV_mlvfrmTypeNONE').parentNode);
				Element.show($('PSV_mlvfrmTypeVALUE').parentNode);
				Element.hide($('PSV_ZygosityContainer'));
				Element.hide($('PSV_consequenceContainer'));
//			$('mlvfrmTypeVALUE').parentNode.show();		
			}
		} else {
			if (fd.selectedType == "VALUE") {
			    $('PSV_mlvfrmTypeNONE').checked = true;
				fd.selectedType= "NONE";
			}
			Element.hide($('PSV_mlvfrmTypeVALUE').parentNode);
//			$('mlvfrmTypeVALUE').parentNode.hide();
		}
		if (dm.flagType) {
		    Element.show($('PSV_mlvfrmTypeFLAG').parentNode);
//			$('mlvfrmTypeFLAG').parentNode.show();			
		} else {
			if (fd.selectedType == "FLAG") {
			    $('PSV_mlvfrmTypeNONE').checked = true;
				fd.selectedType = "NONE";
			}
			Element.hide($('PSV_mlvfrmTypeFLAG').parentNode);
//			$('mlvfrmTypeFLAG').parentNode.hide();
		}

		jQuery('.genotypeOptionsContainer').hide();
		// redraw the info panel according to saved selection value (radio selectors)
		switch (fd.selectedType) {
			case "NONE":
			    $('PSV_mlvfrmFLAG').hide();
			    $('PSV_mlvfrmVALUE').hide();
				break;
			case "FLAG":
			    $('PSV_mlvfrmVALUE').hide();
			    $('PSV_mlvfrmFLAG').show();
				break;
			case "VALUE":
			    $('PSV_mlvfrmVALUE').show();
			    $('PSV_mlvfrmFLAG').hide();
				// hide all inputs panels
			    $('PSV_mlvfrmEnterOperator').hide();
			    $('PSV_mlvfrmEnterStringOperator').hide();
			    $('PSV_mlvfrmEnterVal').hide();
			    $('PSV_mlvfrmEnterVals').hide();
			    $('PSV_mlvfrmEnterStr').hide();
			    $('PSV_mlvfrmEnterEnum').hide();
			    $('PSV_mlvfrmEnterDbOperator').hide();
				$('PSV_frmEnterRSID').hide();
				$('PSV_frmEnterGeneName').hide();
				// display what we need
				switch(dm.valueType) {
					case "POSFLOAT":
					case "POSINT":
					case "FLOAT":
					case "INT":
					    $('PSV_mlvfrmEnterOperator').show();
						// are we showing two input boxes?
						if (fd.numericOperator=="BETWEEN") {
						    $('PSV_mlvfrmEnterVals').show();
						} else {
						    $('PSV_mlvfrmEnterVal').show();
						}
						i2b2.PatientSetViewer.view.modalLabValues.setUnits();
						break;
					case "LRGSTR":
					    $('PSV_mlvfrmEnterStr').show();
					    $('PSV_mlvfrmEnterDbOperator').show();
						break;
					case "GENOTYPE":
						// var selectedOption = jQuery('input:radio[name=frmgenoType]:checked').val();
						if(dm.searchByRsId){
							$('PSV_frmEnterRSID').show();
							$('PSV_frmEnterGeneName').hide();
							$('PSV_frmEnterRSIDText').show();
							$('PSV_frmEnterGeneNameText').hide();
							frmEnterRSIDText.innerHTML = 'RS Identifier:';
							// $('frmEnterRSIDValue').value = 'rs';
							jQuery('.genomicsOptionsContainer').show();
							Element.hide($('PSV_consequenceContainer'));
							jQuery('#PSV_searchRSID').hide();
							jQuery( "#PSV_frmEnterRSIDValue" ).autocomplete({
								// appendTo: '.mlvBody', 
								source: function( request, response ) {
									jQuery.ajax({
									  url: "genomicsAutoComplete.php",
									  dataType: "json",
									  data: {
										request_type: "ajax",
										op:'rsid',
										basecode :dm.basecode,
										term: jQuery( "#PSV_frmEnterRSIDValue" ).val()
									  },
									  success: function( data ) {
										var rep = new Array(); // response array
										// simple loop for the options
										for (var i = 0; i < data.length; i++) {
											var item = data[i];
											if ( item.c_name )
												// add element to result array
												rep.push({
													label: item.c_name,
													value: item.c_name,
												});
										}
										if(rep.length>0){
											var isIE11 = !!navigator.userAgent.match(/Trident.*rv\:11\./);
											// send response
											if(isIE11)
												response( rep.slice(0, 100) );
											else
												response( rep );
										}
										else
										{
											jQuery('#PSV_searchRSID').hide();
										}
									  }
									});
								},
								minLength:5,
								delay: 700,
								search: function(event, ui) { 
									jQuery('#PSV_searchRSID').show();
								},
								focus: function( event, ui ) {
									var a = 1;
									// return false;
								},
								select: function(event,ui){
									jQuery( "#PSV_frmEnterRSIDValue" ).val( ui.item.c_name );
								},
										// optional
								html: true, 
								// optional (if other layers overlap the autocomplete list)
								open: function(event, ui) {
									jQuery(".ui-autocomplete").css("z-index", 1000);
									jQuery(this).focus();
									jQuery('#PSV_searchRSID').hide();
								}
							}).autocomplete( "widget" ).addClass( "gtpAutoComplete" );
						}
						if(dm.searchByGeneName)
						{
							$('PSV_frmEnterRSID').hide();
							$('PSV_frmEnterGeneName').show();
							$('PSV_frmEnterRSIDText').hide();
							$('PSV_frmEnterGeneNameText').show();
							// $('frmEnterRSIDValue').value = '';
							// Element.hide($('ZygosityContainer'));
							Element.show($('PSV_ZygosityContainer'));
							Element.show($('PSV_consequenceContainer'));
							// Element.hide($('genotypesContainer'));
							jQuery( "#PSV_frmEnterGeneNameValue" ).autocomplete({
								// source:'genomicsAutoComplete.php', 
								source: function( request, response ) {
									jQuery.ajax({
									  url: "genomicsAutoComplete.php",
									  dataType: "json",
									  data: {
										request_type: "ajax",
										op:'gene',
										term: jQuery( "#PSV_frmEnterGeneNameValue" ).val()
									  },
									  success: function( data ) {
										var rep = new Array(); // response array
										// simple loop for the options
										for (var i = 0; i < data.length; i++) {
											var item = data[i];
											if ( item.c_name )
												// add element to result array
												rep.push({
													label: item.c_name,
													value: item.c_name,
												});
										}
										if(rep.length>0){
											// send response
											response( rep );
										}
										else
										{
											jQuery('#PSV_searchGeneName').hide();
										}
									  }
									});
								},
								minLength:1,
								search: function(event, ui) { 
									jQuery('#PSV_searchGeneName').show();
								},
								focus: function( event, ui ) {
									jQuery( "#PSV_frmEnterRSIDValue" ).val( ui.item.c_name );
									return false;
								},
								select: function(event,ui){
									var a = ui.c_name;
								},
										// optional
								html: true, 
								// optional (if other layers overlap the autocomplete list)
								open: function(event, ui) {
									jQuery(".ui-autocomplete").css("z-index", 1000);
									jQuery('#PSV_searchGeneName').hide();
								}
							}).autocomplete( "widget" ).addClass( "gtpAutoComplete" );
						}
						
						
						break;
					case "STR":
					    $('PSV_mlvfrmEnterStringOperator').show();
					    $('PSV_mlvfrmEnterStr').show();
						break;
					case "ENUM":
					    $('PSV_mlvfrmEnterStr').hide();
					    $('PSV_mlvfrmEnterEnum').show();
						break;
				}
				break;
		}			
		i2b2.PatientSetViewer.view.modalLabValues.formdata.ignoreChanges = false;
	},
	
// ================================================================================================== //
	ValidateSave: function() {
		var dm = i2b2.PatientSetViewer.view.modalLabValues.cfgTestInfo;
		var fd = i2b2.PatientSetViewer.view.modalLabValues.formdata;
		var tmpLabValue = {};
		var errorMsg = [];
		switch (fd.selectedType) {
			case "NONE":
			    if (i2b2.PatientSetViewer.view.modalLabValues.isModifier) {
					delete i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.ModValues;
				} else {
					delete i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.LabValues;					
				}
				return true;
				break;
			case "FLAG":
				tmpLabValue.MatchBy = "FLAG";
				var tn = $('PSV_mlvfrmFlagValue');
				tmpLabValue.ValueFlag = tn.options[tn.selectedIndex].value;
				tmpLabValue.FlagsToUse = dm.flagType;
				break;
			case "VALUE":
				tmpLabValue.MatchBy = "VALUE";
				// validate the data entry boxes
				switch(dm.valueType) {
					case "POSFLOAT":
					case "POSINT":
					case "FLOAT":
					case "INT":
						tmpLabValue.GeneralValueType = "NUMBER";
						tmpLabValue.SpecificValueType = dm.valueType;
						var valInputs = [];
						tmpLabValue.NumericOp = fd.numericOperator;
						if (fd.numericOperator=="BETWEEN") {
							// verify that Low/High are correct
						    var iv1 = $('PSV_mlvfrmNumericValueLow');
						    var iv2 = $('PSV_mlvfrmNumericValueHigh');
							iv1.value = iv1.value.strip();
							iv2.value = iv2.value.strip();
							tmpLabValue.ValueLow = Number(iv1.value);
							tmpLabValue.ValueHigh = Number(iv2.value);
							valInputs.push(iv1);
							valInputs.push(iv2);
							tmpLabValue.UnitsCtrl = $('PSV_mlvfrmUnits');
						} else {
						    var iv1 = $('PSV_mlvfrmNumericValue');
							tmpLabValue.Value = Number(iv1.value);
							iv1.value = iv1.value.strip();
							valInputs.push(iv1);
							tmpLabValue.UnitsCtrl = $('PSV_mlvfrmUnits');
						}
						// loop through all the 
						for(var i=0; i<valInputs.length; i++){
							var tn = Number(valInputs[i].value);
							if (isNaN(tn)) {
								errorMsg.push(" - One or more inputs are not a valid number\n");	
							}
							if (dm.valueValidate.onlyInt) {
								if (parseInt(valInputs[i].value) != valInputs[i].value) {
									errorMsg.push(" - One or more inputs are not integers\n");	
								}
							}
							if (dm.valueValidate.onlyPos) {
								if (parseFloat(valInputs[i].value) < 0) {
									errorMsg.push(" - One or more inputs have a negative value\n");	
								}
							}
						}
						// make sure the values are in the correct order
						if (fd.numericOperator=="BETWEEN" && (parseFloat(iv1) > parseFloat(iv2))) {
							errorMsg.push(" - The low value is larger than the high value\n");
						}
						
						// CONVERT VALUES TO MASTER UNITS
						if (dm.valueUnits[fd.unitIndex].excluded) {
							alert('You cannot set a numerical value using the current Unit Of Measure.');
							return false;
						}
						if (dm.valueUnits.find(function(o){ return ((o.masterUnit === true) && (o.excluded===true)); })) {
							alert('You cannot set a numerical value because the master Unit Of Measure is declared as invalid.');
							return false;
						}
						try {
							var convtMult = dm.valueUnits[fd.unitIndex].multFactor;
							if (tmpLabValue.ValueHigh) tmpLabValue.ValueHigh = (tmpLabValue.ValueHigh * convtMult);
							if (tmpLabValue.ValueLow) tmpLabValue.ValueLow = (tmpLabValue.ValueLow * convtMult);
							if (tmpLabValue.Value) tmpLabValue.Value = (tmpLabValue.Value * convtMult);
							for (var i=0; i<dm.valueUnits.length;i++){
								if (dm.valueUnits[i].masterUnit) {
									tmpLabValue.UnitsCtrl = dm.valueUnits[i].name;
									break;
								}
							}
						} catch(e) {
							alert('An error was encountered while converting Units!');
							return false;
						}
						break;
					case "LRGSTR":
						tmpLabValue.GeneralValueType = "LARGESTRING";
						tmpLabValue.SpecificValueType = "LARGESTRING";
						tmpLabValue.DbOp = fd.dbOperator;
						var sv = $('PSV_mlvfrmStrValue').value;
						if (dm.valueValidate.maxString && (sv.length > dm.valueValidate.maxString)) {
							errorMsg.push(" - Input is over the "+dm.valueValidate.maxString+" character limit.\n");
						} else {
						    tmpLabValue.ValueString = $('PSV_mlvfrmStrValue').value;
						}
						break;
					case "GENOTYPE":
						tmpLabValue.GeneralValueType = "GENOTYPE";
						tmpLabValue.SpecificValueType = "GENOTYPE";
						tmpLabValue.searchByRsId = false;
						tmpLabValue.searchByGeneName = false;
						tmpLabValue.DbOp = true;
						
						// var selectedOption = jQuery('input:radio[name=frmgenoType]:checked').val();

						if(dm.searchByRsId){  //Validate rsid input
							tmpLabValue.searchByRsId = true;
							tmpLabValue.searchByGeneName = false;
							
							var rsIdVal = jQuery("#PSV_frmEnterRSIDValue").val();
							if(rsIdVal.indexOf('|')>0)
							{
								var rsIdSplit = rsIdVal.split("|");
								var valueStr = rsIdSplit[0].trim();
								tmpLabValue.Allele = null;
								tmpLabValue.Consequence = null;
								
								for(var j = 1 ; j < rsIdSplit.length ; j++)
								{
									var thisInput = rsIdSplit[j].trim();
									if(j==1){
										// var RefToAlt = i2b2.CRC.view.modalLabValues.GetAlleleForInput(thisInput);
										var RefToAlt = thisInput;
										if(RefToAlt)
										{
											var RefToAltSplit = RefToAlt.split("to");
											if(RefToAltSplit.length>=2)
											{
												var allele = RefToAltSplit[0].trim() + "_to_" + RefToAltSplit[1].trim();
												tmpLabValue.Allele = allele;
												continue;
											}
										}
									}
									else
									{
										var consequence = i2b2.PatientSetViewer.view.modalLabValues.GetConsequenceForRSId(thisInput);
										if(consequence)
										{
											tmpLabValue.Consequence = consequence;
											continue;
										}
									}
								}
							}
							else{
								var valueStr = rsIdVal;
							}
							
							if(valueStr.length==0)
								errorMsg.push("The text for rs# can't be empty!");
							else{
								if((valueStr.match("^rs")) && (valueStr.length>=3))
								{
									var valueStrFinal = valueStr.replace(/-/g, '_');   //Replace the hyphens from rs identifier with underscores
									valueStrFinal = valueStrFinal.replace(/ /g,"_"); //Replace the blanks from rs identifier with underscores
									tmpLabValue.ValueString = valueStrFinal;
								}
								else
								{
									if(!valueStr.match("^rs"))
										errorMsg.push("The text for rs# should start with 'rs'");
									else
										errorMsg.push("The text for rs# is invalid");
								}
							}
							var zygsity = i2b2.PatientSetViewer.view.modalLabValues.GetZygosities();
							if(zygsity.length==0)
								errorMsg.push("\nThe zygosity is required. Please make a selection.");
							else
								tmpLabValue.Zygosity = zygsity;
						}
						if(dm.searchByGeneName)  //Validate gene name input
						{
							tmpLabValue.searchByRsId = false;
							tmpLabValue.searchByGeneName = true;
							
							var geneName = jQuery("#PSV_frmEnterGeneNameValue").val();
							
							
							var valueStr = geneName.replace(/-/g, '_');   //Replace the hyphens from gene names with underscores
							valueStr = valueStr.replace(/ /g,"_"); //Replace the blanks from gene names with underscores
							if(valueStr.length==0)
								errorMsg.push("The text for gene name can't be empty!");
							else
								tmpLabValue.ValueString = valueStr;
								
							var zygsity = i2b2.PatientSetViewer.view.modalLabValues.GetZygosities();
							if(zygsity.length==0)
								errorMsg.push("\nThe zygosity is required. Please make a selection.");
							else
								tmpLabValue.Zygosity = zygsity;
							
							var consequnce = i2b2.PatientSetViewer.view.modalLabValues.GetConsequences();
							// if(consequnce.length==0)
								// errorMsg.push("\nThe consequence is required. Please make a selection.");
							// else
								tmpLabValue.Consequence = consequnce;
						}
						
						//tmpLabValue.Zygosity = jQuery( "#PSV_zygosityTypes option:selected" ).val();
						break;						
					case "STR":
						tmpLabValue.GeneralValueType = "STRING";
						tmpLabValue.SpecificValueType = "STRING";
						tmpLabValue.StringOp = fd.stringOperator;
						var sv = $('PSV_mlvfrmStrValue').value;
						if (dm.valueValidate.maxString && (sv.length > dm.valueValidate.maxString)) {
							errorMsg.push(" - Input is over the "+dm.valueValidate.maxString+" character limit.\n");
						} else if (sv.length == 0) {
							errorMsg.push("The text for this value are blank.");
						} else {
						    tmpLabValue.ValueString = $('PSV_mlvfrmStrValue').value;
						}
						break;
					case "ENUM":
						tmpLabValue.GeneralValueType = "ENUM";
						tmpLabValue.SpecificValueType = "ENUM";
						tmpLabValue.ValueEnum = [];
						tmpLabValue.NameEnum = [];
						var t = $('PSV_mlvfrmEnumValue').options;
						for (var i=0; i<t.length;i++) {
							if (t[i].selected) {
								tmpLabValue.ValueEnum.push(t[i].value); //dm.enumInfo[t[i].value]);
								tmpLabValue.NameEnum.push(t[i]);
							}
						}
						break;
				}
				break;
		}
		// bail on errors
		if (errorMsg.length != 0) {
			var errlst = errorMsg.uniq();
			var errlst = errlst.toString();
			alert('The following errors have occurred:\n'+errlst);
			delete tmpLabValue;
			return false;
		}
		// save the labValues data into the node's data element
		if (i2b2.PatientSetViewer.view.modalLabValues.isModifier) {
			if (tmpLabValue) {
				i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.ModValues = tmpLabValue;
			} else {
				delete i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.ModValues;
			}
		} else { 
			if (tmpLabValue) {
				i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.LabValues = tmpLabValue;
			} else {
				delete i2b2.PatientSetViewer.view.modalLabValues.i2b2Data.LabValues;
			}
		}
		return true;
	},
	
	GetAlleleForInput: function(alleleName){
		var alleles = [
			'A to C',
			'A to G',
			'A to T',
			'C to A',
			'C to G',
			'C to T',
			'G to A',
			'G to C',
			'G to T',
			'T to A',
			'T to C',
			'T to G',
		];
		var matchingAllele = null;
		for(var i = 0 ; i < alleles.length ; i++)
		{
			var thisAllele = alleles[i];
			if(alleleName.trim().toLowerCase() == thisAllele.trim().toLowerCase())
			{
				matchingAllele = thisAllele;
				break;
			}
		}
		return matchingAllele;
	},
	
	GetConsequenceForRSId: function(consequenceName){
		var consequences = [
			['Frameshift','Frameshift'],
			['In Frame','In_frame'],
			['Missense','missense'],
			['Nonsense','nonsense'],
			['Start Loss','start_loss'],
			['Stop Loss','stop_loss'],
			['Synonymous','synonymous'],
			["3'UTR","3'UTR"],
			["5'UTR","5'UTR"],
			['Downstream (500 bases)','downstream'],
			['Exon (Non-Coding)','exon'],
			['Intron','intron'],
			['Upstream (2 kilobases)','upstream'],
			['Missing Consequence','missing_consequence']
		];
		var matchingConsequenceValue = null;
		for(var i=0;i<consequences.length;i++)
		{
			var thisConsequenceName = consequences[i][0];
			var thisConsequenceValue = consequences[i][1];
			if(consequenceName==thisConsequenceName)
				matchingConsequenceValue = thisConsequenceValue;
		}
		return matchingConsequenceValue;
	},
	
	GetConsequences: function(){
		var consequencesList = jQuery("#PSV_consequenceTypes").multipleSelect("getSelects");
		// var consequencesList = consequence.split(",");
		var consequences = "";
		if(consequencesList.length==1)
		{
			var item = consequencesList[0];
			if(item != ""){
				consequences = item;
			}
		}
		else if((consequencesList.length==2) && (consequencesList[0].toLowerCase()=='' || consequencesList[1].toLowerCase()==''))
		{
			var item = consequencesList[0];
			if(item.toLowerCase()=='')
			{
				item = consequencesList[1];
			}
			if(item != ""){
				consequences = item;
			}
		}
		else
		{
			for(var i = 0 ; i < consequencesList.length ; i++)
			{
				var item = consequencesList[i];
				if(i==0)
					consequences += "(";
				if(item != ""){
					if(i < consequencesList.length-1)
						consequences += item + " OR ";
					else
						consequences += item + ")";
				}
			}
		}
		return consequences;
	},

	GetZygosities: function(){
		var zygosityList = jQuery("#PSV_zygosityTypes").multipleSelect("getSelects");
		var zygosities = "";
		if(zygosityList.length==1)
		{
			var item = zygosityList[0];
			if(item != ""){
				zygosities = item;
			}
		}
		// else if((zygosityList.length==2) && (zygosityList[0].toLowerCase()=='' || zygosityList[1].toLowerCase()==''))
		// {
			// var item = zygosityList[0];
			// if(item.toLowerCase()=='')
			// {
				// item = zygosityList[1];
			// }
			// if(item != ""){
				// zygosities = item;
			// }
		// }
		else
		{
			for(var i = 0 ; i < zygosityList.length ; i++)
			{
				var item = zygosityList[i];
				if(i==0)
					zygosities += "(";
				if(item != ""){
					if(i < zygosityList.length-1)
						zygosities += item + " OR ";
					else
						zygosities += item + ")";
				}
			}
		}
		return zygosities;
	},
	
	isTextSelected: function(input) {
		if (typeof input.selectionStart == "number") {
			return input.selectionStart == 0 && input.selectionEnd == input.value.length;
		} else if (typeof document.selection != "undefined") {
			input.focus();
			return document.selection.createRange().text == input.value;
		}
	}
}
