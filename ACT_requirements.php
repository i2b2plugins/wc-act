<!DOCTYPE html>
<?php
 /**
  * Copyright (c) 2006-2018 Massachusetts General Hospital
  * All rights reserved. This program and the accompanying materials
  * are made available under the terms of the i2b2 Software License v2.1
  * which accompanies this distribution.
  *
  * ACT_requirements.php
  * Collection of functions that test various dependencies for ACT plugins
  * @category ACT
  * @package  Validator
  * @author   Jay Tarantino
  * @version  March 30, 2018
  */
?>
<html>
  <head> 
    <title>ACT Validator</title>
    <link type="text/css" href="assets/ACT.css" rel="stylesheet" />
    <script src="js-ext/jquerycode/jquery-1.11.3.min.js"></script>

    <script>
      if(!document.getElementsByClassName)  //IE does not have getElementsByClassName... 
      {
          document.getElementsByClassName = function(className) {
          return this.querySelectorAll("." + className);
      };
      
     }
    </script>
  
  </head>

  <body>
    <script>
  
      function switchMode()
      {
       
       var preInstalls =  document.getElementsByClassName('preIn');
        if(document.getElementById('preCheck').checked)
        {
          for(var i = 0; i < preInstalls.length; i++) {
            preInstalls[i].style.display="none";
           }

        }
        else
        {
          for(var i = 0; i < preInstalls.length; i++) {
            preInstalls[i].style.display="";
           }
          
        }
      }

      function toggleConfigView()
      {
        var btn = document.getElementById('togButton');
        var dv = document.getElementById('codeView');

        
        if(btn.innerHTML =='Show')
        {
          dv.style.display = '';
          btn.innerHTML = 'Hide';
        }
        else
        {
          dv.style.display = 'none';
          btn.innerHTML = 'Show';
        }

      }

      function sendFeedback() {
        //Work in progress: collets the test results from the LI collection.  Adds the site name.
        //Will send to PHP service that emails us the resutls.  
        //May offer a text box to allow user to add commmetns

        var summary = new Array();
        var testResults = jQuery('li');
        testResults.each(function(idx, li) {
            summary.push(jQuery(li).text());    
           });
         
         ret = JSON.stringify(summary);
         //TODO:  send ret to service

         alert('The following data:\n\n' +ret + '\n\nHas been sent to us.  \nThank you.');               
        
            
      }


    </script>
  <section>
  <h2>ACT Validator</h2>
  <div style="position:relative;" >This ACT utility has checked your install for various requirements. If these requirements are not met, your ACT install may not run, or have issues. <br> 
  The requirements checked are such things as, the correct version of PHP, correct PHP extensions, 
  a working directory that has the correct permissions set, 
  and more. As new requirements are created, their tests will be added to this page.  <br> 
  By reviewing the test results below, one can easily see any potential issues with the ACT install.  <br>
  Also you can click the <b>Refresh</b> button to see if changes you have made to your install have cleared up any issues. 
  <br><br>
  <a href="#" onclick="sendFeedback();"   title="Submit System Diagnostics."  role="button" style="display:none;float:right;" >Submit System Diagnostics</a>
   <br>
  </div>  
  <div id="preCkDiv" style="display:none;" >For a system requirements test only, check the Prerequisites box.&nbsp;
    <input id="preCheck" type="checkbox" name="preCheck" onclick="switchMode();" checked ><label for="preCheck"><b>Prerequisites</b></label>   
    <a href="#" onclick="location.reload();"   title="Get latest test results."  role="button" style="float:right;" >Refresh</a>
  </div> 
  <div id="errDiv">PHP Error. Please Check ACT_config.php for errors.&nbsp;<a href="https://community.i2b2.org/wiki/display/ACT/Issues" target="_blank" title="Opens the ACT Plugin Wiki page for ACT config  issues in a new tab">more info</a> </div>
  </section>
    
  <?php
  

require('ACT_inspector.php');

$summary = '<section><div><h3>Results of ACT Testing</h3><ul>'; 
$styleClass='';

//Hidden Info to be sent for future send feedback option
//************************ */
global $ACT_configs;
$summary = $summary . '<li style="display:none;" >Site Name: ' . $ACT_configs['site_name'] . '</li>'; 

//"PRE" install checks
//************************ */
$results = new TestResults();
$results = testACT_getOSInfo();
$styleClass = setUIClass($results->fail,true);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary . '<li class="'.$styleClass.'">OS Info: ' .$rm . '</li>';

$results = new TestResults();
$results = testACT_getPHPVersion('php');
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary . '<li class="'.$styleClass.'">PHP Version: ' .$rm . '</li>';

$results = new TestResults();
$results = testACT_getPHPVersion('curl');
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary . '<li class="'.$styleClass.'">PHP cURL version: ' .$rm . '</li>';

$results = new TestResults();
$results = testACT_getPHPVersion('json');
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary . '<li class="'.$styleClass.'">PHP Extension JSON version: ' .$rm . '</li>';

$results = new TestResults();
$results = testACT_testSystem_command('at');
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;(In addition, ATD service must be running.)&nbsp;' . $results->wiki->link();
$summary = $summary . '<li class="'.$styleClass.'">AT command: ' .$rm . '</li>';

//"POST" install checks
//************************ */
$results = new TestResults();
$results = testACT_check_working_directory();
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary .'<li style="display:none;" class="'.$styleClass.' preIn">Working Directory: ' . $rm . '</li>';

$results = new TestResults();
$results = testACT_getFreeSpace();
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary . '<li style="display:none;" class="'.$styleClass.' preIn">Remaining Space: ' .$rm . '</li>';

$results = new TestResults();
$results = testACT_SHRINE_URL_found();
$styleClass = setUIClass($results->fail);
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();
$summary = $summary .'<li style="display:none;" class="'.$styleClass.' preIn">SHRINE URL: ' . $rm . '</li>';



$summary = $summary . '</ui></div>';

$results = new TestResults();
$results = testACT_showACT_Config();
$rm = $results->message;
$rm =  $rm . '&nbsp;' . $results->wiki->link();

$togButton = '<a href="#" id="togButton" onclick="toggleConfigView();"   title="switch view of config file"  role="button" >Show</a>';

$summary = $summary . '<div id="acDiv" style="display:none;" >View of ACT Config File&nbsp;' .$togButton . '<br>' . $rm .  '</div>';

$summary = $summary . '</section>';


echo $summary;



function setUIClass($fail,$infoItem)
{
    if($fail)
      return 'fail';
    else
      if(! $infoItem)
        return 'pass';
        else
          return 'info';
}

?>

<script>
  //if the PHP require command for the config file, then this script will exe and hide the error div and show the pre install div
   document.getElementById('errDiv').style.display="none";
   document.getElementById('preCkDiv').style.display="";
   document.getElementById('acDiv').style.display="";
  </script>
  </body>

</html>



