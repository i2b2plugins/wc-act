<?php

  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * PatientsListGenerator_FromQuery.php
   * Fetches patient identifiers from Previous Query and generates a csv file for MRN Exporter plugin
   * @category i2b2
   * @package  PatientListExporter
   * @author   Bhaswati Ghosh
   * @version  March 2017
   */

$CONFIG = include('../../../../../ACT_config.php');

function _XML_getPDO_fromInputList($min, $max, $event_type){
	global $crc_uri, $domain, $userId, $login_password, $project, $patient_set_coll_id, $msgId, $send_facility, $receive_facility,$timestamp;
$xml = <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns6:request xmlns:ns4="http://www.i2b2.org/xsd/cell/crc/psm/1.1/"
  xmlns:ns7="http://www.i2b2.org/xsd/cell/crc/psm/querydefinition/1.1/"
  xmlns:ns3="http://www.i2b2.org/xsd/cell/crc/pdo/1.1/"
  xmlns:ns5="http://www.i2b2.org/xsd/hive/plugin/"
  xmlns:ns2="http://www.i2b2.org/xsd/hive/pdo/1.1/"
  xmlns:ns6="http://www.i2b2.org/xsd/hive/msg/1.1/">
	<message_header>
		<proxy>
            <redirect_url>I2B2_CRC_URI</redirect_url>
        </proxy>
		<sending_application>
			<application_name>i2b2_QueryTool</application_name>
			<application_version>1.6</application_version>
		</sending_application>
		<sending_facility>
			<facility_name>i2b2</facility_name>
		</sending_facility>
		<receiving_application>
			<application_name>i2b2_DataRepositoryCell</application_name>
			<application_version>1.6</application_version>
		</receiving_application>
		<receiving_facility>
			<facility_name>i2b2</facility_name>
		</receiving_facility>
		<message_type>
			<message_code>Q04</message_code>
			<event_type>I2B2_EVENT_TYPE_EQQ</event_type>
		</message_type>
		<security>
			<domain>I2B2_DOMAIN</domain>
			<username>I2B2_USERID</username>
			I2B2_LOGIN_PASSWORD
		</security>
		<message_control_id>
			<message_num>MESSAGE_ID</message_num>
			<instance_num>0</instance_num>
		</message_control_id>
		<processing_id>
			<processing_id>P</processing_id>
			<processing_mode>I</processing_mode>
		</processing_id>
		<accept_acknowledgement_type>messageId</accept_acknowledgement_type>
		<project_id>I2B2_PROJECT</project_id>
	</message_header>
	<request_header>
		<result_waittime_ms>180000</result_waittime_ms>
	</request_header>
	<message_body>
		<ns3:pdoheader>
			<patient_set_limit></patient_set_limit>
			<estimated_time>180000</estimated_time>
			<request_type>getPDO_fromInputList</request_type>
		</ns3:pdoheader>
		<ns3:request xsi:type="ns3:GetPDOFromInputList_requestType" 
		  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<input_list>
				<patient_list max="PATIENT_LIST_MAX" min="PATIENT_LIST_MIN">
					<patient_set_coll_id>I2B2_PATIENT_SET_COLLECTION_ID</patient_set_coll_id>
				</patient_list>
			</input_list>
			<filter_list>
			</filter_list>
			<output_option>
				<patient_set select="using_input_list" onlykeys="true"/>
			</output_option>
		</ns3:request>
	</message_body>
</ns6:request>
XML;

	$xml = str_replace("I2B2_CRC_URI", $crc_uri, $xml);
	$xml = str_replace("I2B2_DOMAIN", $domain, $xml);
	$xml = str_replace("I2B2_USERID", $userId, $xml);
	$xml = str_replace("I2B2_LOGIN_PASSWORD", $login_password, $xml);
	$xml = str_replace("I2B2_PROJECT", $project, $xml);
	$xml = str_replace("MESSAGE_ID", $msgId, $xml);
	$xml = str_replace("I2B2_PATIENT_SET_COLLECTION_ID", $patient_set_coll_id, $xml);
	$xml = str_replace("PATIENT_LIST_MAX", $max, $xml);
	$xml = str_replace("PATIENT_LIST_MIN", $min, $xml);
	$xml = str_replace("I2B2_EVENT_TYPE", $event_type, $xml);
	return $xml;
}

function _postXML($request_xml){
	global  $logging, $job_id, $crc_uri, $jobs_directory,$timestamp;

	$ch = curl_init($crc_uri);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
	curl_setopt($ch, CURLOPT_POSTFIELDS, "$request_xml");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	if($logging){  //Write the request and response messages on disk when logging mode is on
		$reqFileName = $jobs_directory . '/PatientListExporter_FromPrevQuery_request_' . $timestamp . '.xml';
		$xmlfile = fopen($reqFileName, "w");
		fwrite($xmlfile, $request_xml);
		fclose($xmlfile);
	
		$resFileName = $jobs_directory . '/PatientListExporter_FromPrevQuery_response_' . $timestamp . '.xml';
		$xmlfile = fopen($resFileName, "w");
		fwrite($xmlfile, $response);
		fclose($xmlfile);
	}

	// To-do: handle number of retries before returning $response
	return $response;
}

// Start Processing
$logging = $CONFIG['patient_list_exporter_logging'];
$crc_uri = urldecode($_GET['cell_url']);
$domain = $_GET['domain'];
$project = $_GET['project'];

$jobs_directory = $CONFIG['working_directory'];

$userId = $_GET['user_id'];
$login_password = $_GET['session'];
$msgId = $_GET['msgId'];
$waitTime = 180;
$patient_set_size = $_GET[patient_set_size];
$patient_set_coll_id = $_GET[patient_set_coll_id];

$timestamp = date("Y_m_d_H_i_s");
$page_size = 50000;

$payload = "\r\n";

$event_type = "PatientListExport_FromPrevQuery"  ;

//Find out how many batches of 50 PDO calls need to be made
$pages = 1;
if($patient_set_size > $page_size){
	$pages = ceil($patient_set_size / $page_size);
}

//Start calling PDO in batches of 50
for($page=0;$page<$pages;$page++){
	$request_xml = _XML_getPDO_fromInputList(1+($page_size*$page),$page_size+($page_size*$page), $event_type);
	$response_xml = _postXML($request_xml);
	
	$doc = simplexml_load_string($response_xml);
		
	$query = '//patient';
	$result = $doc->xpath($query);
	
	if($page == 0){
		$payload = "i2b2_Patient_Num\n";
	}
	
	foreach($result as $patient){
		$patient_id = $patient->patient_id;
		$payload .= $patient_id;
		$payload .= "\r\n";
	}	
}
$csvfileName = $jobs_directory . '/' . $userId . '_'  . $timestamp . '.csv';
$payloadfile = fopen($csvfileName, "w");
fwrite($payloadfile, $payload);
fclose($payloadfile);

header('Set-Cookie: fileDownload=true; path=/');
header('Cache-Control: max-age=60, must-revalidate');
header('Content-type: text/csv');
header('Content-Disposition: attachment; filename="' . $userId . '_' . $timestamp . '.csv"');
echo $payload;
?>
