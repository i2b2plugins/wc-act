/**
 * @projectDescription	The Date Range Constraint controller (GUI-only controller).
 * @inherits 	i2b2.CRC.ctrlr
 * @namespace	i2b2.CRC.ctrlr.dateConstraint
 * @author		Nick Benik, Griffin Weber MD PhD
 * @version 	1.3
 * ----------------------------------------------------------------------------------------
 * updated 9-15-08: RC4 launch [Nick Benik] 
 */

//console.group('Load & Execute component file: CRC > ctrlr > Dates');
//console.time('execute time');

// ================================================================================================== //
i2b2.PatientSetViewer.UI.DateConstraint = {
	defaultStartDate: '12/01/1979',
	defaultEndDate: '12/31/2006',
	conceptObj: false,
    conceptIndex: -1,

// ================================================================================================== //
	showDates: function( conceptListIndex )
    {
        this.conceptObj     = i2b2.PatientSetViewer.model.concepts[conceptListIndex]; // remember our concept object
        this.conceptIndex   = conceptListIndex;

		// only build the dialog box once
	    if (!i2b2.PatientSetViewer.UI.ModalDates)
        {
			var handleSubmit = function()
            {
			    var closure_pi = i2b2.PatientSetViewer.UI.DateConstraint.conceptObj;
				// save the dates
			    if (i2b2.PatientSetViewer.UI.DateConstraint.doProcessDates(closure_pi))
				    if (this.submit()) // saved and validated, close modal form
                    {
				        i2b2.PatientSetViewer.model.dirtyResultsData = true; // table is now stale, get a new one
				        i2b2.PatientSetViewer.conceptsRender(); //update GUI
				    }
			};
			var handleCancel = function()
            {
				this.cancel();
			}
			i2b2.PatientSetViewer.UI.ModalDates = new YAHOO.widget.SimpleDialog("dateConstraintDialog",
            {
				width: "400px",
				fixedcenter: true,
				constraintoviewport: true,
				modal: true,
				zindex: 700,
				buttons: [{
					        text: "OK",
					        isDefault: true,					
					        handler: handleSubmit
				          }, 
                          {
					        text: "Cancel",
					        handler: handleCancel
				          }]
			});
			$('dateConstraintDialog').show();
			i2b2.PatientSetViewer.UI.ModalDates.render(document.body);
		}
		i2b2.PatientSetViewer.UI.ModalDates.show();
		// load our panel data				
		var DateRecord = new Object;
		if (this.conceptObj.dateFrom)
		    DateRecord.Start = padNumber(this.conceptObj.dateFrom.Month, 2) + '/' + padNumber(this.conceptObj.dateFrom.Day, 2) + '/' + this.conceptObj.dateFrom.Year;
		else 
			DateRecord.Start = this.defaultStartDate; 
		$('PSV_ConstraintDateStart').value = DateRecord.Start;
		if (this.conceptObj.dateTo)
		    DateRecord.End = padNumber(this.conceptObj.dateTo.Month, 2) + '/' + padNumber(this.conceptObj.dateTo.Day, 2) + '/' + this.conceptObj.dateTo.Year;
	    else
        {
			var curdate = new Date(); 
			DateRecord.End = padNumber(curdate.getMonth()+1,2)+'/'+padNumber(curdate.getDate(),2)+'/'+curdate.getFullYear();
		}
		$('PSV_ConstraintDateEnd').value = DateRecord.End;
		if (this.conceptObj.dateFrom)
        {
		    $('PSV_CheckboxDateStart').checked = true;
		    $('PSV_ConstraintDateStart').disabled = false;
		} 
        else 
        {
		    $('PSV_CheckboxDateStart').checked = false;
		    $('PSV_ConstraintDateStart').disabled = true;
		}
		if (this.conceptObj.dateTo)
        {
		    $('PSV_CheckboxDateEnd').checked = true;
		    $('PSV_ConstraintDateEnd').disabled = false;
		} 
        else 
        {
		    $('PSV_CheckboxDateEnd').checked = false;
		    $('PSV_ConstraintDateEnd').disabled = true;
		}
	},

// ================================================================================================== //
	toggleDate: function() {
	    if ($('PSV_CheckboxDateStart').checked) {
	        $('PSV_ConstraintDateStart').disabled = false;
	        setTimeout("$('PSV_ConstraintDateStart').select()", 150);
		} else {
	        $('PSV_ConstraintDateStart').disabled = true;
		}
	    if ($('PSV_CheckboxDateEnd').checked) {
	        $('PSV_ConstraintDateEnd').disabled = false;
	        setTimeout("$('PSV_ConstraintDateEnd').select()", 150);
		} else {
	        $('PSV_ConstraintDateEnd').disabled = true;
		}
	},

// ================================================================================================== //
	doShowCalendar: function(whichDate) {
		// create calendar if not already initialized
		if (!this.DateConstrainCal) {
			this.DateConstrainCal = new YAHOO.widget.Calendar("DateContstrainCal","calendarDiv");
			this.DateConstrainCal.selectEvent.subscribe(this.dateSelected, this.DateConstrainCal,true);
		}
		this.DateConstrainCal.clear();
		// process click
		if (whichDate=='S') {
		    if ($('PSV_CheckboxDateStart').checked == false) { return; }
		    var apos = Position.cumulativeOffset($('PSV_DropDateStart'));
            // tdw9: reuse calendarDiv from default.html
		    var cx = apos[0] - $("calendarDiv").getWidth() + $('PSV_DropDateStart').width + 3;
		    var cy = apos[1] + $('PSV_DropDateStart').height + 3;
			$("calendarDiv").style.top = cy+'px';
			$("calendarDiv").style.left = cx+'px';
			$("PSV_ConstraintDateStart").select();
			var sDateValue = $('PSV_ConstraintDateStart').value;
		} else {
		    if ($('PSV_CheckboxDateEnd').checked == false) { return; }
			var apos = Position.cumulativeOffset($('PSV_DropDateEnd'));
			var cx = apos[0] - $("calendarDiv").getWidth() + $('PSV_DropDateEnd').width + 3;
			var cy = apos[1] + $('PSV_DropDateEnd').height + 3;
			$("calendarDiv").style.top = cy+'px';
			$("calendarDiv").style.left = cx+'px';
			$("PSV_ConstraintDateEnd").select();
			var sDateValue = $('PSV_ConstraintDateEnd').value;
		}
		var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
		if (rxDate.test(sDateValue)) {
			var aDate = sDateValue.split(/\//);
			this.DateConstrainCal.setMonth(aDate[0]-1);
			this.DateConstrainCal.setYear(aDate[2]);
		} else {
			alert("Invalid Date Format, please use mm/dd/yyyy or select a date using the calendar.");
		}
		// save our date type on the calendar object for later use
		this.whichDate = whichDate;
		// display everything
		$("calendarDiv").show();
		var viewdim = document.viewport.getDimensions();
		$("calendarDivMask").style.top = "0px"; // reuse calendarDivMask
		$("calendarDivMask").style.left = "0px";
		$("calendarDivMask").style.width = (viewdim.width - 10) + "px";
		$("calendarDivMask").style.height = (viewdim.height - 10) + "px";
		$("calendarDivMask").show();
		this.DateConstrainCal.render(document.body);
	},

// ================================================================================================== //
	dateSelected: function(eventName, selectedDate) {
		// function is event callback fired by YUI Calendar control 
		// (this function looses it's class scope)
	    var cScope = i2b2.PatientSetViewer.UI.DateConstraint;
		if (cScope.whichDate=='S')
		    var tn = $('PSV_ConstraintDateStart');
		else
		    var tn = $('PSV_ConstraintDateEnd');
		var selectDate = selectedDate[0][0];
		tn.value = selectDate[1]+'/'+selectDate[2]+'/'+selectDate[0];
		cScope.hideCalendar.call(cScope);
	},

// ================================================================================================== //
	hideCalendar: function() {
		$("calendarDiv").hide();
		$("calendarDivMask").hide();
	},

// ================================================================================================== //
	doProcessDates: function(conceptObj) 
    {
		// push the dates into the data model
		var sDate = new String;
		var sDateError = false;
		var rxDate = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/
		var DateRecord = {};
		this.conceptObj = conceptObj;
		// parse start date and store in DateRecord
		if ($('PSV_CheckboxDateStart').checked) 
        {
			DateRecord.Start = {};
			sDate = $('PSV_ConstraintDateStart').value;
			if (rxDate.test(sDate)) 
            {
				var aDate = sDate.split(/\//);
				DateRecord.Start.Month = padNumber(aDate[0],2);
				DateRecord.Start.Day = padNumber(aDate[1],2);
				DateRecord.Start.Year = aDate[2];
			}
            else
				sDateError = "Invalid Start Date\n";
		}
		// end date
		if ($('PSV_CheckboxDateEnd').checked) 
        {
			DateRecord.End = {};
			sDate = $('PSV_ConstraintDateEnd').value;
			if (rxDate.test(sDate)) 
            {
				var aDate = sDate.split(/\//);
				DateRecord.End.Month = padNumber(aDate[0]);
				DateRecord.End.Day = padNumber(aDate[1]);
				DateRecord.End.Year = aDate[2];
			} else
				sDateError = "Invalid End Date\n";
		}
		// check for processing errors
		if (sDateError) 
        {
			sDateError += "\nPlease use the following format: mm/dd/yyyy";
			alert(sDateError);
			return false; // return failure (for setting date range)
		} 
        else 
        {
			// attach the data to our Concept Object data
			if (DateRecord.Start)
			    conceptObj.dateFrom = DateRecord.Start;
			else
			    delete conceptObj.dateFrom;
			if (DateRecord.End)
			    conceptObj.dateTo = DateRecord.End;
			else
			    delete conceptObj.dateTo;
		}
		return true; // return success (for setting date range)
	}
};