/*This is the first test of an ACT plug in install.
  The service will check the ACT config file for proper values such as:
  no defaults, no blanks.  Like actual vaulues.  --jmt67 2018
*/


//Returns False if there are no issues, otherwise an object with errors
jQuery(document).ready(function(){
  try {
    jQuery.ajax({
      type: 'GET',
      url: "ACT_inspector.php",
      data: {'test':true},
      dataType: 'json',
      cache: false,
    })
      .done(function (configStatus) {
        var errors = '';
        if (configStatus.error) {
          jQuery.each(configStatus.errorList, function (index, value) {
            errors += value + "\n";
          });

          alert("Warning:\nPossible errors found in the ACT config file\n" +
            "ACT plugins may not work as expected\n" +
            "Please check ACT_config.php file for correct entries.\n\nErrors:\n" + errors);
        }

      })
      .fail(function (jqXHR, textStatus, error) {
        alert("Warning:\nUnable to read the ACT config file\nACT plugins may not work as expected.\n" + error);
      });
  }
  catch (e) {
    alert("Warning:\nUnable to read the ACT config file\nACT plugins may not work as expected.\n" + e);
  }
});