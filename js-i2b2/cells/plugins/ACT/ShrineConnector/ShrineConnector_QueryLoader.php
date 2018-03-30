<?php

  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * ShrineConnector_QueryLoader.php
   * Fetches SHRINE queries from the local SHRINE cell
   * @category i2b2
   * @package  ShrineConnector
   * @author   Bhaswati Ghosh
   * @version  1.0
   * @since    January 2018
   */

$CONFIG = include('../../../../../ACT_config.php');
	
class QueryObj {
  public $created = "";
  public $id  = "";
  public $name = "";
  public $networkid = "";
  public $userid = "";
  public $group  = "";
  public $flagged = "";
  public $flagMessage = "";
  public $held  = "";
}

//Makes an admin call to the local Shrine hub to get all Shrine queries
function _XML_getQueries(){
	global $shrine_uri, $domain, $user_id, $session, $project, $waitTime, $msgId, $send_facility, $receive_facility, $category, $max, $shrine_match_str, $shrine_user_id;
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
			<redirect_url>{proxy_info}</redirect_url>
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
		<security>
		   <domain>{sec_domain}</domain>
		   <username>{sec_user}</username>
		   {sec_pass_node}
		</security>
		<message_type>
			<message_code>Q04</message_code>
			<event_type>EQQ</event_type>
		</message_type>
		<message_control_id>
			<message_num>{header_msg_id}</message_num>
			<instance_num>0</instance_num>
		</message_control_id>
		<processing_id>
			<processing_id>P</processing_id>
			<processing_mode>I</processing_mode>
		</processing_id>
		<accept_acknowledgement_type>AL</accept_acknowledgement_type>
		<project_id>{sec_project}</project_id>
		<country_code>US</country_code>
	</message_header>
	<request_header>
		<result_waittime_ms>{result_wait_time}000</result_waittime_ms>
	</request_header>
	<message_body>
		<ns4:psmheader>
		   <user login="{sec_user}">{sec_user}</user>
		   <patient_set_limit>0</patient_set_limit>
		   <estimated_time>0</estimated_time>
		</ns4:psmheader>
		<ns4:get_name_info category="{query_category}" max="{max_num}">
		   <match_str strategy="contains">{shrine_match_str}</match_str>
		   <user_id>{shrine_user_id}</user_id>
		   <ascending>false</ascending>
		</ns4:get_name_info>
	</message_body>
</ns6:request>
XML;

	$xml = str_replace("{proxy_info}", $shrine_uri, $xml);
	$xml = str_replace("{sec_domain}", $domain, $xml);
	$xml = str_replace("{sec_user}", $user_id, $xml);
	$xml = str_replace("{sec_pass_node}", $session, $xml);
	$xml = str_replace("{sec_project}", $project, $xml);
	$xml = str_replace("{header_msg_id}", $msgId, $xml);
	$xml = str_replace("{result_wait_time}", $waitTime, $xml);
	$xml = str_replace("{header_msg_datetime}", date(DATE_ATOM, time()), $xml);
	$xml = str_replace("{query_category}", $category, $xml);
	$xml = str_replace("{max_num}", $max, $xml);
	$xml = str_replace("{shrine_match_str}", $shrine_match_str, $xml);
	$xml = str_replace("{shrine_user_id}", $shrine_user_id, $xml);
	return $xml;
}

function _postXML($request_xml){
	global $logging, $shrine_uri, $log_path;

	$ch = curl_init($shrine_uri);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
	curl_setopt($ch, CURLOPT_POSTFIELDS, "$request_xml");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	$timestamp = date("Y_m_d_H_i_s");
	
	if($logging){
		$xmlfileName = $log_path . '/ShrineConnector_request_' . $timestamp . '.xml';
		$xmlfile = fopen($xmlfileName, "w");
		fwrite($xmlfile, $request_xml);
		fclose($xmlfile);

		$xmlfileName = $log_path . '/ShrineConnector_response_' . $timestamp . '.xml';
		$xmlfile = fopen($xmlfileName, "w");
		fwrite($xmlfile, $response);
		fclose($xmlfile);
	}

	return $response;
}

function result_status_error($xml_resp){
	
	if(preg_match("/<condition type=\"ERROR\">/i", $xml_resp, $match)){
		return true;
	}
	return false;
}

function result_status_success($xml_resp){
	
	if(preg_match("/<condition type=\"DONE\">/i", $xml_resp, $match)){
		return true;
	}
	return false;
}

function _parseShrineResponse($response_xml){
	global $json;

	$data = array();
	$result->status = "SUCCESS";
	if(!preg_match("/<condition type=\"ERROR\">/i", $response_xml, $match)){
		
		$doc = simplexml_load_string($response_xml);
		$queries = $doc ->xpath("//query_master");

		foreach($queries as $query){
			$myObj = new QueryObj();
			$myObj->name = (string)$query->name;
			$myObj->created = (string)$query->create_date;
			$myObj->id = (string)$query->query_master_id;
			$myObj->networkid = (string)$query->network_query_id;
			$myObj->userid = (string)$query->user_id;
			$myObj->group = (string)$query->group_id;
			$myObj->flagged = (string)$query->flagged;
			$myObj->flagmessage = (string)$query->flagMessage;
			$myObj->held = (string)$query->held;
			$data[] = $myObj;
		}
		$result->model = $data;
	}
	else{
		$result->status = "ERROR";
		$result->msg = "There were issues reading Shrine queries";
	}
	
	$json[] = $result;
}
	
	$shrine_uri = $CONFIG['shrine_url'];
	$log_path = $CONFIG['working_directory'];
	$logging = $CONFIG['shrine_connector_logging'];
	$domain = $_GET['domain'];
	$project = $_GET['project'];
	$user_id = $_GET['user_id'];
	$session = $_GET['session'];
	$msgId = $_GET['msgId'];
	$waitTime = 180;
	$category = $_GET['category'];
	$max = $_GET['max'];
	$shrine_match_str = $_GET['shrine_match_str'];
	$shrine_user_id = $_GET['shrine_user_id'];

	
	$request_xml =_XML_getQueries();
	$response_xml = _postXML($request_xml);

	$json = array();
	if(result_status_success($response_xml)){
		_parseShrineResponse($response_xml);
	}
	
	echo json_encode($json);
?>
