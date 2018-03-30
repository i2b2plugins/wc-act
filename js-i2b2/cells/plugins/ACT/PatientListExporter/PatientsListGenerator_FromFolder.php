<?php

  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * PatientsListGenerator_FromFolder.php
   * Fetches patient i2b2 numbers and generates a csv file for Patient List Exporter plugin
   * @category i2b2
   * @package  PatientListExporter
   * @author   Bhaswati Ghosh
   * @version  December 2017
   */


$CONFIG = include('../../../../../ACT_config.php');
//Makes a call to getChildren webservice
function _XML_getChildren(){
	global $work_uri, $domain, $user_id, $session, $project, $parentKey, $waitTime, $msgId, $send_facility, $receive_facility;
$xml = <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	<ns3:request xmlns:ns3="http://www.i2b2.org/xsd/hive/msg/1.1/" 
	xmlns:ns4="http://www.i2b2.org/xsd/cell/work/1.1/" 
	xmlns:ns2="http://www.i2b2.org/xsd/hive/plugin/" 
	xmlns:ns5="http://www.i2b2.org/xsd/cell/ont/1.1/">
	<message_header>
		<proxy>
            <redirect_url>{proxy_info}</redirect_url>
        </proxy>
		<i2b2_version_compatible>1.1</i2b2_version_compatible>
		<sending_application>
			<application_name>i2b2_QueryTool</application_name>
			<application_version>1.6</application_version>
		</sending_application>
		<sending_facility>
			<facility_name>i2b2</facility_name>
		</sending_facility>
		<receiving_application>
			<application_name>i2b2_WorkplaceCell</application_name>
			<application_version>1.6</application_version>
		</receiving_application>
		<receiving_facility>
			<facility_name>i2b2</facility_name>
		</receiving_facility>
		<datetime_of_message>{header_msg_datetime}</datetime_of_message>
		<security>
			<domain>{sec_domain}</domain>
			<username>{sec_user}</username>
			{sec_pass_node}
		</security>
		<message_control_id>
			<message_num>{header_msg_id}</message_num>
			<instance_num>0</instance_num>
		</message_control_id>
		<processing_id>
			<processing_id>P</processing_id>
			<processing_mode>I</processing_mode>
		</processing_id>
		<accept_acknowledgement_type>AL</accept_acknowledgement_type>
		<application_acknowledgement_type>AL</application_acknowledgement_type>
		<country_code>US</country_code>
		<project_id>{sec_project}</project_id>
	</message_header>
	<request_header>
		<result_waittime_ms>{result_wait_time}000</result_waittime_ms>
	</request_header>
	<message_body>
		<ns4:get_children blob="true">
			<parent>{parent_key_value}</parent>
		</ns4:get_children>
	</message_body>
	</ns3:request>
XML;

	$xml = str_replace("{proxy_info}", $work_uri, $xml);
	$xml = str_replace("{sec_domain}", $domain, $xml);
	$xml = str_replace("{sec_user}", $user_id, $xml);
	$xml = str_replace("{sec_pass_node}", $session, $xml);
	$xml = str_replace("{sec_project}", $project, $xml);
	$xml = str_replace("{header_msg_id}", $msgId, $xml);
	$xml = str_replace("{parent_key_value}", $parentKey, $xml);
	$xml = str_replace("{result_wait_time}", $waitTime, $xml);
	$xml = str_replace("{header_msg_datetime}", date(DATE_ATOM, time()), $xml);
	return $xml;
}

function _postXML($request_xml){
	global $logging, $work_uri, $jobPath;

	$ch = curl_init($work_uri);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
	curl_setopt($ch, CURLOPT_POSTFIELDS, "$request_xml");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	//Temporary
	$timestamp = date("Y_m_d_H_i_s");
	
	if($logging){  //Write the request and response messages on disk when logging mode is on
		$xmlfileName = $jobPath . '/PatientListExporter_FromWorkFolder_request_' . $timestamp . '.xml';
		$xmlfile = fopen($xmlfileName, "w");
		fwrite($xmlfile, $request_xml);
		fclose($xmlfile);

		$xmlfileName = $jobPath . '/PatientListExporter_FromWorkFolder_response_' . $timestamp . '.xml';
		$xmlfile = fopen($xmlfileName, "w");
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
	
	if(preg_match("/<status type=\"DONE\">Workplace processing completed<\/status>/i", $xml_resp, $match)){
		return true;
	}
	return false;
}

function _parseWorkResponse($response_xml){
	$data = "";
	if(!preg_match("/<status type=\"ERROR\">/i", $response_xml, $match)){
		$doc = simplexml_load_string($response_xml);
		$result = $doc->xpath("//folder");
		$headerRowReqd = true;

		foreach($result as $folder){
			$name = $folder->name;
			$typeOfFolder = $folder->work_xml_i2b2_type;
			if( !empty($typeOfFolder) && (strtolower( $typeOfFolder) == 'patient' ))
			{
				if($headerRowReqd)
				{
					$data = "i2b2_Patient_Num\n";
					$headerRowReqd = false;
				}
				
				
				$this_patient_id = $folder->work_xml->xpath('.//patient_id');
				if(!empty($this_patient_id))
				{
					$data .= $this_patient_id[0];
				}
				else
					$data .= $name;
				$data .= "\r\n";
			}					
		}

		
	}
	else{
		$data = "There were issues in generating Patients i2b2 number list";
	}
	return $data;
}

	// Start Processing
	$logging = $CONFIG['patient_list_exporter_logging']; // for debug purposes
	$work_uri = urldecode($_GET['cell_url']);
	$domain = $_GET['domain'];
	$project = $_GET['project'];

	$jobPath = $CONFIG['working_directory'];
	$user_id = $_GET['user_id'];
	$session = $_GET['session'];
	$parentKey = $_GET['parentKey'];
	$msgId = $_GET['msgId'];
	$waitTime = 180;

	$timestamp = date("Y_m_d_H_i_s");
	header('Set-Cookie: fileDownload=true; path=/');
	header('Cache-Control: max-age=60, must-revalidate');
	header('Content-type: text/csv');
	header('Content-Disposition: attachment; filename="' . $user_id . '_' . $timestamp . '.csv"');

	$request_xml =_XML_getChildren();
	$response_xml = _postXML($request_xml);
	$csvData = "";
	if(result_status_success($response_xml)){
		$timestamp = date("Y_m_d_H_i_s");
		$csvData = _parseWorkResponse($response_xml);
		$csvfileName = $jobPath . '/' . $user_id . '_'  . $timestamp . '.csv';
		$csvfile = fopen($csvfileName, "w");
		fwrite($csvfile, $csvData);
		fclose($csvfile);
	}
	else {
		$csvData = "No data received";
	}
	echo $csvData;
?>
