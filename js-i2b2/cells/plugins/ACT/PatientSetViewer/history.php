<?php

/**
 * Renders the Download History HTML after authenticating with a POSTed i2b2 user and session key
 * to be called via AJAX by the Download Data plugin
 *
 * @name       history.php
 * @category   Biobank Portal
 * @package    PatientSetViewer
 * @author     Nich Wattanasin <nwattanasin@partners.org>
 * @copyright  2016 Partners Healthcare
 * @version    1.1
 * @updated    July 13, 2016
 */

$CONFIG = include('../../../../../ACT_config.php');

function isAdmin($userid){
	global $config_download_admin_users;
	/*	foreach($config_download_admin_users as $admin){
		if(strtolower($userid) == strtolower($admin)) return true;
		}*/
	return false;
};

function _XML_getUserAuth(){
	global $config_i2b2_PM_URI, $config_i2b2_domain, $user_id, $session;
$xml = <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<i2b2:request xmlns:i2b2="http://www.i2b2.org/xsd/hive/msg/1.1/" xmlns:pm="http://www.i2b2.org/xsd/cell/pm/1.1/">
    <message_header>
        <proxy>
            <redirect_url>I2B2_PM_URI</redirect_url>
        </proxy>

        <i2b2_version_compatible>1.1</i2b2_version_compatible>
        <hl7_version_compatible>2.4</hl7_version_compatible>
        <sending_application>
            <application_name>i2b2 Project Management</application_name>
            <application_version>1.6</application_version>
        </sending_application>
        <sending_facility>
            <facility_name>i2b2 Hive</facility_name>
        </sending_facility>
        <receiving_application>
            <application_name>Project Management Cell</application_name>
            <application_version>1.6</application_version>
        </receiving_application>
        <receiving_facility>
            <facility_name>i2b2 Hive</facility_name>
        </receiving_facility>
        <datetime_of_message>2016-04-06T14:24:53-04:00</datetime_of_message>
		<security>
			<domain>I2B2_DOMAIN</domain>
			<username>I2B2_USERID</username>
			I2B2_LOGIN_PASSWORD
		</security>
        <message_control_id>
            <message_num>DcKfdAa0PzbNHiQtYE64N</message_num>
            <instance_num>0</instance_num>
        </message_control_id>
        <processing_id>
            <processing_id>P</processing_id>
            <processing_mode>I</processing_mode>
        </processing_id>
        <accept_acknowledgement_type>AL</accept_acknowledgement_type>
        <application_acknowledgement_type>AL</application_acknowledgement_type>
        <country_code>US</country_code>
        <project_id>undefined</project_id>
    </message_header>
    <request_header>
        <result_waittime_ms>180000</result_waittime_ms>
    </request_header>
    <message_body>
        <pm:get_user_configuration>
            <project>undefined</project>
        </pm:get_user_configuration>
    </message_body>
</i2b2:request>
XML;

	$xml = str_replace("I2B2_PM_URI", $config_i2b2_PM_URI, $xml);
	$xml = str_replace("I2B2_DOMAIN", $config_i2b2_domain, $xml);
	$xml = str_replace("I2B2_USERID", $user_id, $xml);
	$xml = str_replace("I2B2_LOGIN_PASSWORD", $session, $xml);
	return $xml;
}

function _postXML($request_xml){
	global $config_download_jobs_directory, $config_i2b2_PM_URI;

	$ch = curl_init($config_i2b2_PM_URI);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
	curl_setopt($ch, CURLOPT_POSTFIELDS, "$request_xml");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	// To-do: handle number of retries before returning $response
	
	return $response;
}

function result_status_success($xml_resp){
	
	if(preg_match("/<status type=\"DONE\">PM processing completed<\/status>/i", $xml_resp, $match)){
		return true;
	}
	return false;
}

function validate_job($data){
  /*	if(property_exists($data, 'patient_set_size')){
		if($data->patient_set_size > 0){
			return true;
		}
	}
	return false;
  */
return true;
}

$config_download_admin_users = '';
$config_download_jobs_directory = $CONFIG['working_directory'];
$config_i2b2_PM_URI = $_POST['pm_uri'] . 'getServices';
$config_i2b2_domain = $_POST['domain'];

$user_id = $_POST['user_id'];
$session = $_POST['session'];
$project = $_POST['project'];
$request_xml = _XML_getUserAuth();
$response_xml = _postXML($request_xml);
$output = "";

if(result_status_success($response_xml)){

	$output .= "<table id='PatientSetViewer-HistoryResults' cellspacing='0'>\n";
	if(isAdmin($user_id)){
		$output .= "<tr><th>Job ID</th><th>User</th><th>Last Updated</th><th>Patient Set Size</th><th>Table Definition</th><th>Status</th></tr>\n";
	} else {
		$output .= "<tr><th>Last Updated</th><th>Patient Set Size</th><th>Table Definition</th><th>Status</th></tr>\n";
	}

	$files = array();
	$job_count = 0;
	$dir = new DirectoryIterator($config_download_jobs_directory);
	foreach ($dir as $fileinfo) {
		if (!$fileinfo->isDot()) {
			$jobfile = $fileinfo->getFilename();
			if(isAdmin($user_id)){
				if((substr($jobfile, -4) == '.job')){
					$files[$fileinfo->getMTime()] = $jobfile;
				}
			} else {
				if((substr($jobfile, 0, strlen($user_id)) === $user_id) && (substr($jobfile, -4) == '.job')){
					$files[$fileinfo->getMTime()] = $jobfile;
				}
			}
		}
	}

	krsort($files);

	foreach ($files as $mtime => $jobfile){

		$time_diff = time() - $mtime;
		
		$job_user = explode("_", $jobfile, 2);
		$job_user = $job_user[0];
		$job_count++;
		$file = file_get_contents($config_download_jobs_directory.'/'.$jobfile);
		$job_id = substr($jobfile, 0, strlen($jobfile)-4);
		$data = json_decode($file);
		if(property_exists($data, 'project')){
			$job_project = $data->project;
		} else {
			$job_project = 'Biobank_Prod';
		}
		// comment next line to process PREVIEW status
		if($data->status == 'PREVIEW') continue;
		if($data->status == 'NEW') continue;
		switch($data->status){
			case 'PREVIEW':
                                $status = "<strong></strong><a style=\"color:#000;text-decoration:underline;font-weight:normal;\" href=\"#\" onclick=\"javascript:i2b2.PatientSetViewer.loadDefinition('".$job_id."');return false;\">Load Definition</a>";

				break;
			case 'PROCESSING':
				if($time_diff > 10800){
					$status = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/warning.gif" align="absbottom"/> <em>Timed Out</em><br/>Processed: ' . $data->payload . " [<a href=\"#\" onclick=\"i2b2.PatientSetViewer.cancelJob('".$job_id."');return false;\">Cancel</a>]";
				} else {
					$status = '<img src="js-i2b2/cells/plugins/ACT/PatientSetViewer/assets/ajaxicon.gif" align="absbottom"/> Processing: ' . $data->payload . " [<a href=\"#\" onclick=\"i2b2.PatientSetViewer.cancelJob('".$job_id."');return false;\">Cancel</a>]";
				}
				break;
			case 'FINISHED':
				$status = "<strong>Completed: </strong><a style=\"color:#000;text-decoration:underline;font-weight:normal;\" href=\"#\" onclick=\"javascript:i2b2.PatientSetViewer.downloadJob('".$job_id."');return false;\">Download</a>";
				if(isAdmin($user_id)){
					$status .= "<br/><a href=\"#\" style=\"color:#000;text-decoration:underline;font-weight:normal;\" onclick=\"i2b2.PatientSetViewer.rerunJob('".$job_id."');return false;\">Re-run</a>";
				}
				break;
			case 'CANCELLED':
				$status = 'Cancelled By User';
				if(isAdmin($user_id)){
					$status .= "<br/><a href=\"#\" style=\"color:#000;text-decoration:underline;font-weight:normal;\" onclick=\"i2b2.PatientSetViewer.rerunJob('".$job_id."');return false;\">Re-run</a>";
				}
				break;
			default:
				$status = $data->status;
		}
		if(($project == $job_project) && validate_job($data)){

			$output .= "<tr>";
			if(isAdmin($user_id)){
				$output .= "<td>".$jobfile."</td>";
				$output .= "<td>".$job_user."</td>";
			}
			$output .= "<td>".date ("F d Y H:i", $mtime)."</td>";
			$output .= "<td>";
			if(property_exists($data, 'patient_set_size')) $output .= $data->patient_set_size;
			$output .= "</td>";
			$concept_count = 0;
			$definition_output = "";
			if(property_exists($data, 'model')){
			  foreach($data->model->required as $key => $obj){
			    if(property_exists($obj, 'display')){
			      if($obj->display){
				$concept_count++;
				$definition_output .= "<li>";
				$definition_output .= $obj->name . " [Value]";
				$definition_output .= "</li>";
			      }
			      
			    }
			    
			  }
			  foreach($data->model->concepts as $key => $obj){
			    if(property_exists($obj, 'textDisplay') && property_exists($obj, 'dataOption')){
			      $concept_count++;
			      $definition_output .= "<li>";
			      $definition_output .= $obj->textDisplay . " [" . $obj->dataOption . "]";
			      $definition_output .= "</li>";
			    }
			  }
			}
			$output .= "<td style='text-align:left;'>Total # of Concepts (Columns): ".$concept_count."<ol>";
			$output .= $definition_output . "</ol><a href=\"#\" onclick=\"javascript:i2b2.PatientSetViewer.loadDefinition('" . $job_id . "');return false;\">Load Definition</a></td>";
			if($data->status == 'FINISHED'){
				$output .= "<td style='background: #C9F3C9;color: #0C5D0C;text-shadow:none;'>$status</td>";
			} else {
				$output .= "<td>$status</td>";
			}
			$output .= "</tr>\n";
		}
	}
	$output .= "</table>";
} else {
	$output .= "Unable to fetch history at this time. Please try again later.";
	$xmlfile = fopen($config_download_jobs_directory . '/ERROR-History-PM_request_'.$user_id.'.xml', "w");
	fwrite($xmlfile, $request_xml);
	fclose($xmlfile);

	$xmlfile = fopen($config_download_jobs_directory . '/ERROR-History-PM_response_'.$user_id.'.xml', "w");
	fwrite($xmlfile, $response_xml);
	fclose($xmlfile);
}

print $output;
?>
