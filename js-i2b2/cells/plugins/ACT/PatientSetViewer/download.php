<?php
  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * download.php
   * 
   * @category i2b2
   * @package  PatientSetViewer
   * @author   Nich Wattanasin
   * @version  March 23, 2018
   * @since    April 4, 2016
   */

$CONFIG = include('../../../../../ACT_config.php');

function _XML_getUserAuth(){
	global $pm_uri, $domain, $user_id, $session;
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

	$xml = str_replace("I2B2_PM_URI", $pm_uri, $xml);
	$xml = str_replace("I2B2_DOMAIN", $domain, $xml);
	$xml = str_replace("I2B2_USERID", $user_id, $xml);
	$xml = str_replace("I2B2_LOGIN_PASSWORD", $session, $xml);
	return $xml;
}

function _postXML($request_xml){
	global $config_download_jobs_directory, $logging, $pm_uri, $job_id;

	$ch = curl_init($pm_uri);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
	curl_setopt($ch, CURLOPT_POSTFIELDS, "$request_xml");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	if($logging){
		$xmlfile = fopen($config_download_jobs_directory . '/PM_request_' . $job_id . '.xml', "w");
		fwrite($xmlfile, $request_xml);
		fclose($xmlfile);

		$xmlfile = fopen($config_download_jobs_directory . '/PM_response_' . $job_id . '.xml', "w");
		fwrite($xmlfile, $response);
		fclose($xmlfile);
	}

	// To-do: handle number of retries before returning $response
	
	return $response;
}

function result_status_error($xml_resp){
	
	if(preg_match("/<status type=\"ERROR\">/i", $xml_resp, $match)){
		return true;
	}
	return false;
}

function result_status_success($xml_resp){
	
	if(preg_match("/<status type=\"DONE\">PM processing completed<\/status>/i", $xml_resp, $match)){
		return true;
	}
	return false;
}

$config_download_jobs_directory = $CONFIG['working_directory'];
$logging = false;
$pm_uri = $_POST['pm_uri'] . 'getServices';
$domain = $_POST['domain'];

$user_id = $_POST['user_id'];
$session = $_POST['session'];
$job_id = $_POST['job_id'];

$file = $config_download_jobs_directory . '/csv_' . $job_id . '.csv';
$download_filename = 'Download_' . $user_id . '_' . date("Y-m-d",filemtime($file)) . '.csv';

$request_xml = _XML_getUserAuth();
$response_xml = _postXML($request_xml);


if(result_status_success($response_xml)){

	if (file_exists($file)) {
		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename='.$download_filename);
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate');
		header('Pragma: public');
		header('Content-Length: ' . filesize($file));
		ob_clean();
		flush();
		readfile($file);
		exit;
	}
} else {
	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename='.$download_filename);
	header('Content-Transfer-Encoding: binary');
	header('Expires: 0');
	header('Cache-Control: must-revalidate');
	header('Pragma: public');
	header('Content-Length: 23');
	ob_clean();
	flush();
	echo 'Download Not Authorized';
	exit;

}
?>