<?php
  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital 
   * All rights reserved. This program and the accompanying materials 
   * are made available under the terms of the i2b2 Software License v2.1 
   * which accompanies this distribution. 
   * 
   * worker_sxe.php
   * Worker process runs on seperate thread to generate table from i2b2 PDO
   * @category i2b2
   * @package  PatientSetViewer
   * @author   Nich Wattanasin
   * @version  March 23, 2018
   * @since    April 4, 2016
   */

$CONFIG = include('../../../../../ACT_config.php');

function _XML_getPDO_fromInputList($min, $max, $event_type){
  global $crc_uri, $domain, $userid, $login_password, $project, $patient_set_coll_id, $filterlist, $observation_set;
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
			<facility_name>PHS</facility_name>
		</sending_facility>
		<receiving_application>
			<application_name>i2b2_DataRepositoryCell</application_name>
			<application_version>1.6</application_version>
		</receiving_application>
		<receiving_facility>
			<facility_name>PHS</facility_name>
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
			<message_num>uToDh4cUv1ZU726vw3m84</message_num>
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
I2B2_FILTER_LIST
</filter_list>
<output_option names="asattributes">
	I2B2_OBSERVATION_SET
	<patient_set select="using_input_list" onlykeys="false"/>
</output_option>
		</ns3:request>
	</message_body>
</ns6:request>
XML;

	$xml = str_replace("I2B2_CRC_URI", $crc_uri, $xml);
	$xml = str_replace("I2B2_DOMAIN", $domain, $xml);
	$xml = str_replace("I2B2_USERID", $userid, $xml);
	$xml = str_replace("I2B2_LOGIN_PASSWORD", $login_password, $xml);
	$xml = str_replace("I2B2_PROJECT", $project, $xml);
	$xml = str_replace("I2B2_PATIENT_SET_COLLECTION_ID", $patient_set_coll_id, $xml);
	$xml = str_replace("I2B2_FILTER_LIST", $filterlist, $xml);
	$xml = str_replace("PATIENT_LIST_MAX", $max, $xml);
	$xml = str_replace("PATIENT_LIST_MIN", $min, $xml);
	$xml = str_replace("I2B2_EVENT_TYPE", $event_type, $xml);
	$xml = str_replace("I2B2_OBSERVATION_SET", $observation_set, $xml);
	return $xml;
}

function _postXML($request_xml){
	global $CONFIG, $logging, $job_id, $crc_uri;
	
	if($logging){
		$xmlfile = fopen($CONFIG['working_directory'] . '/request_' . $job_id . '.xml', "w");
		fwrite($xmlfile, $request_xml);
		fclose($xmlfile);
	}

	$ch = curl_init($crc_uri);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
	curl_setopt($ch, CURLOPT_POSTFIELDS, "$request_xml");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	if($logging){
		$xmlfile = fopen($CONFIG['working_directory'] . '/response_' . $job_id . '.xml', "w");
		fwrite($xmlfile, $response);
		fclose($xmlfile);
	}

	// To-do: handle number of retries before returning $response
	
	return $response;
}

function calculate_median($arr) {
    sort($arr);
    $count = count($arr); //total numbers in array
    $middleval = floor(($count-1)/2); // find the middle value, or the lowest middle value
    if($count % 2) { // odd number, middle is the median
        $median = $arr[$middleval];
    } else { // even number, calculate avg of 2 medians
        $low = $arr[$middleval];
        $high = $arr[$middleval+1];
        $median = (($low+$high)/2);
    }
    return $median;
}

function calculate_average($arr) {
    $count = count($arr); //total numbers in array
    foreach ($arr as $value) {
        $total = $total + $value; // total value of array numbers
    }
    $average = ($total/$count); // get average value
    return $average;
}

function _parsePDOResponse($response_xml){
	$data = "";
	if(!preg_match("/<status type=\"ERROR\">/i", $response_xml, $match)){
		$doc = new DOMDocument();
		$doc->loadXML(($response_xml));

		$query = '//patient';
		$xpath = new DOMXPath($doc); 
		$result = $xpath->query($query); 

		foreach($result as $patient){
			$data .= $patient->getElementsByTagName("patient_id")->item(0)->nodeValue;
		}
			
	}
	
	return $data;
}

function _finishJob($job_id, $status, $payload) {
	global $CONFIG;
	$content = array('job_id' => $job_id, 'status' => $status, 'payload' => $payload);
	$jobfile = fopen($CONFIG['working_directory'] . '/' . $job_id . '.job', "w");
	fwrite($jobfile, json_encode($content));
	fclose($jobfile);
}

function _finishPreview($job_id, $payload){
	global $CONFIG;
	$data = _getJob($job_id);
	$data->status = "PREVIEW";
	$data->payload = $payload;
	$jobfile = fopen($CONFIG['working_directory'] . '/' . $job_id . '.job', "w");
	fwrite($jobfile, json_encode($data));
	fclose($jobfile);

}

function _updateJobStatus($job_id, $status, $payload){
	global $CONFIG;
	$data = _getJob($job_id);
	$data->status = $status;
	$data->payload = $payload;
	
	$jobfile = fopen($CONFIG['working_directory'] . '/' . $job_id . '.job', "w");
	fwrite($jobfile, json_encode($data));
	fclose($jobfile);

}

function _getJob($job_id) {
	global $CONFIG;
	$file = file_get_contents($CONFIG['working_directory'] . '/' . $job_id . '.job');
	return json_decode($file);
}

function _outputRequiredFields_header(){
	global $data;
	
	$output = "";
	// Subject ID (subject_id)
	if($data->model->required->subject_id->display)
		$output .= "\"" . $data->model->required->subject_id->name . "\"" . ',';
	// Patient Number (id)
	if($data->model->required->id->display)
		$output .= "\"" . $data->model->required->id->name . "\"" . ',';
	// Gender (gender)
	if($data->model->required->gender->display)
		$output .= "\"" . $data->model->required->gender->name . "\"" . ',';
	// Age (age)
	if($data->model->required->age->display)
		$output .= "\"" . $data->model->required->age->name . "\"" . ',';
	// Race (race)
	if($data->model->required->race->display)
		$output .= "\"" . $data->model->required->race->name . "\"" . ',';
	// DNA (dna)
	if($data->model->required->dna->display)
		$output .= "\"" . $data->model->required->dna->name . "\"" . ',';
	// Plasma (plasma)
	if($data->model->required->plasma->display)
		$output .= "\"" . $data->model->required->plasma->name . "\"" . ',';
	// Serum (serum)
	if($data->model->required->serum->display)
		$output .= "\"" . $data->model->required->serum->name . "\"" . ',';

	$output = rtrim($output, ',');
	return $output;
}

function _outputConcepts_header(){
	global $data;
	
	$output = "";
	foreach($data->model->concepts as $key => $obj){
		$dateTo = false;
		$dateFrom = false;
		$output .= "\"";
		$output .= $obj->textDisplay;
		$output .= " [" . $obj->dataOption . "]";
		
		if(isset($obj->dateFrom)){
			if($obj->dateFrom !== false){
				$dateFrom = true;
			}
		}
		if(isset($obj->dateTo)){
			if($obj->dateTo !== false){
				$dateTo = true;
			}
		}
		
		if($dateFrom && $dateTo){
			$output .= "[".$obj->dateFrom->Month."/".$obj->dateFrom->Day."/".$obj->dateFrom->Year." to ".$obj->dateTo->Month."/".$obj->dateTo->Day."/".$obj->dateTo->Year."]";
		}
		else if($dateFrom && !$dateTo){
			$output .= "[From ".$obj->dateFrom->Month."/".$obj->dateFrom->Day."/".$obj->dateFrom->Year."]";
		}
		else if($dateTo && !$dateFrom){
			$output .= "[To ".$obj->dateTo->Month."/".$obj->dateTo->Day."/".$obj->dateTo->Year."]";
		}
		
		$output .= "\"" . ',';
	}
	$output = rtrim($output, ',');
	return $output;

}

function _outputRequiredFields_forPatient($patient_id){
  global $doc, $data, $preview;
	
  $use_age_in_years_num = false; // to-do: make global configuration
  $output = "";
  
	// Favorited
	if($preview > 0){
	  $output .= "\"";
	  $output .= "<input type=\"checkbox\" id=\"save_".$patient_id."\" onclick=\"i2b2.PatientSetViewer.savePatient('".$patient_id."');\"/>";
	  $output .= "\"";
	  $output .= ',';
	}
	// Subject ID (subject_id)
	if($data->model->required->subject_id->display){
		$xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='subject_id']/text()";
		$results = $doc->xpath($xpath_query);
		$output .= "\"";
		$output .= $results[0];
		$output .= "\"";
		$output .= ',';
	}
	// Patient Number (id)
	if($data->model->required->id->display){
		$output .= "\"" . $patient_id . "\"" . ',';
	}
	// Gender (gender)
	if($data->model->required->gender->display){
		$xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='sex_cd']/text()";
		$results = $doc->xpath($xpath_query);
		$output .= "\"";
		$output .= $results[0];
		$output .= "\"";
		$output .= ',';
	}
	// Age (age)
	if($data->model->required->age->display){
	  $output .= "\"";
	  if($use_age_in_years_num){
	    $xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='age_in_years_num']/text()";
	    $results = $doc->xpath($xpath_query);
	    $output .= $results[0];
	  } else { // calculate from birth_date
	    $xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='birth_date']/text()";
	    $results = $doc->xpath($xpath_query);
	    $value = $results[0];
	    $current_date = date('Y-m-d', time());
	    $current_time = strtotime($current_date);
	    $birth_date_time = strtotime($value);
	    $output .= floor(($current_time - $birth_date_time) / (60*60*24*365));
	  }
	  $output .= "\"";
	  $output .= ',';
	}
	// Race (race)
	if($data->model->required->race->display){
		$xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='race_cd']/text()";
		$results = $doc->xpath($xpath_query);
		$output .= "\"";
		$output .= $results[0];
		$output .= "\"";
		$output .= ',';
	}
	// DNA (dna) example of another type
	if($data->model->required->dna->display){
	  // $xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='specimen_dna']/text()";
	  $xpath_query = "//ns2:observation_set[@panel_name=\"IS_DNA\"]/observation[patient_id=".$patient_id."][1]";
	  $results = $doc->xpath($xpath_query);
	  $output .= "\"";
	  // if($results[0] == '1'){
	  if(count($results) == 1){
	    $output .= "Yes";
	  } else {
	    $output .= "No";
	  }
	  $output .= "\"";
	  $output .= ',';
	}

	$output = rtrim($output, ',');
	return $output;
}


function _outputConcepts_forPatient($patient_id){
	global $doc, $data;

	$output = "";
	foreach($data->model->concepts as $key => $obj){		// $obj = i2b2.BiobankDatafile.model.concepts[$key]
		$table_name = $obj->sdxData->origData->table_name;	// $obj.sdxData.origData.table_name
		if(strtolower($table_name) == "patient_dimension"){
			$column_name = $obj->sdxData->origData->column_name; // "age_in_years_num"
			$dim_code = $obj->sdxData->origData->dim_code; // "0,1,2,3,4,5,6,7,8,9" or "6"
			$operator = $obj->sdxData->origData->operator; // "IN" or "=" or ">=" or "<="
			switch($obj->dataOption){
				case "Existence (Yes/No)":
				  $xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='".strtolower($column_name)."']/text()";
					$results = $doc->xpath($xpath_query);
					$value = $results[0];
					$dim_codes = explode(',', $dim_code);
					$output .= "\"";
					if($operator == 'IN' || $operator == '='){
						if(in_array(strtolower($value), array_map('strtolower',$dim_codes))){
							$output .= "Yes";
						} else if(in_array(strtolower("'".$value."'"), array_map('strtolower',$dim_codes))){
							$output .= "Yes";
						} else {
							$output .= "No";
						}
                                        } elseif($operator == '<='){
                                          if($column_name == 'birth_date'){ // $dim_code = "getdate() - (365.25*90)"
                                            $current_date = date('Y-m-d', time());
                                            $current_time = strtotime($current_date);
                                            $birth_date_time = strtotime($value);
                                            $lower_bound = strtoupper($dim_code);
                                            $lower_bound = str_replace('GETDATE()', $current_time, $lower_bound); // "1520011169 - (365.25*90)
                                            $lower_bound = str_replace('SYSDATE', $current_time, $lower_bound);
                                            $lower_bound = str_replace('*', '*24*60*60*', $lower_bound); // "1520011169 - (365.25*24*60*60*90)
                                            $lower_bound = eval('return '.$lower_bound.';'); // "1204435169"

                                            if($birth_date_time <= $lower_bound){
                                              $output .= "Yes";
                                            } else {
					      $output .= "No";
                                            }
					  }
					} elseif($operator == '>='){
					    if(intval($results[0]) >= intval($dim_code)){
					      $output .= "Yes";
					    } else {
					      $output .= "No";
					    }
					} elseif($operator == 'BETWEEN'){
					  if($column_name == 'birth_date'){ // $dim_code = "getdate() - (365.25*10) AND getdate()"
					    $current_date = date('Y-m-d', time());
					    $current_time = strtotime($current_date);
					    $birth_date_time = strtotime($value);
					    $bounds = explode(" AND ", strtoupper($dim_code)); // "GETDATE() - (365.25*10) AND GETDATE()"
					    $lower_bound = $bounds[0]; // "GETDATE() - (365.25*10)"
					    $upper_bound = $bounds[1]; // "GETDATE()"
					    $lower_bound = str_replace('GETDATE()', $current_time, $lower_bound); // "1520011169 - (365.25*10)
					    $lower_bound = str_replace('SYSDATE', $current_time, $lower_bound);
					    $lower_bound = str_replace('*', '*24*60*60*', $lower_bound); // "1520011169 - (365.25*24*60*60*10)
					    $lower_bound = eval('return '.$lower_bound.';'); // "1204435169"

					    $upper_bound = str_replace('GETDATE()', $current_time, $upper_bound); // "152001169"
                                            $upper_bound = str_replace('SYSDATE', $current_time, $upper_bound);
                                            $upper_bound = str_replace('*', '*24*60*60*', $upper_bound); // "152001169"
                                            $upper_bound = eval('return '.$upper_bound.';'); // "152001169"

					    if(($birth_date_time >= $lower_bound) && ($birth_date_time <= $upper_bound)){
					      $output .= "Yes";
					    } else {
					      $output .= "No";
					    }
					  }

					} // to-do: any other operators in patient_dimension?
					$output .= "\"";
					$output .= ',';

					break;
				case "List of All Values":
				  $xpath_query = "//patient[patient_id=".$patient_id."]/param[@column='".strtolower($column_name)."']/text()";
					$results = $doc->xpath($xpath_query);
					$value = $results[0];
					$dim_codes = explode(',', $dim_code);
					$output .= "\"";
					if($operator == 'IN' || $operator == '='){
						if(in_array(strtolower($value), array_map('strtolower',$dim_codes))){
							$output .= $results[0];
						} else if(in_array(strtolower("'".$value."'"), array_map('strtolower',$dim_codes))){
							$output .= $results[0];
						}
					} elseif($operator == '>='){
						if(intval($results[0]) >= intval($dim_code)){
							$output .= $results[0];
						}
                                        } elseif($operator == '<='){ 
					  if($column_name == 'birth_date'){ // $dim_code = "getdate() - (365.25*90)"
					    $current_date = date('Y-m-d', time());
                                            $current_time = strtotime($current_date);
                                            $birth_date_time = strtotime($value);
					    $lower_bound = strtoupper($dim_code);
                                            $lower_bound = str_replace('GETDATE()', $current_time, $lower_bound); // "1520011169 - (365.25*90)
                                            $lower_bound = str_replace('SYSDATE', $current_time, $lower_bound);
                                            $lower_bound = str_replace('*', '*24*60*60*', $lower_bound); // "1520011169 - (365.25*24*60*60*90)
					    $lower_bound = eval('return '.$lower_bound.';'); // "1204435169"

					    if($birth_date_time <= $lower_bound){
					      $output .= floor(($current_time - $birth_date_time) / (60*60*24*365));
					    } else {

					    }

					  }
					} elseif($operator == 'BETWEEN'){
                                          if($column_name == 'birth_date'){ // $dim_code = "getdate() - (365.25*10) AND getdate()"
                                            $current_date = date('Y-m-d', time());
                                            $current_time = strtotime($current_date);
                                            $birth_date_time = strtotime($value);
                                            $bounds = explode(" AND ", strtoupper($dim_code)); // "GETDATE() - (365.25*10) AND GETDATE()"
                                            $lower_bound = $bounds[0]; // "GETDATE() - (365.25*10)"
                                            $upper_bound = $bounds[1]; // "GETDATE()"
                                            $lower_bound = str_replace('GETDATE()', $current_time, $lower_bound); // "1520011169 - (365.25*10)
                                            $lower_bound = str_replace('SYSDATE', $current_time, $lower_bound);
                                            $lower_bound = str_replace('*', '*24*60*60*', $lower_bound); // "1520011169 - (365.25*24*60*60*10)
                                            $lower_bound = eval('return '.$lower_bound.';'); // "1204435169"

                                            $upper_bound = str_replace('GETDATE()', $current_time, $upper_bound); // "152001169"
                                            $upper_bound = str_replace('SYSDATE', $current_time, $upper_bound);
                                            $upper_bound = str_replace('*', '*24*60*60*', $upper_bound); // "152001169"
                                            $upper_bound = eval('return '.$upper_bound.';'); // "152001169"

                                            if(($birth_date_time >= $lower_bound) && ($birth_date_time <= $upper_bound)){
                                              $output .= floor(($current_time - $birth_date_time) / (60*60*24*365));
					      //$to   = new DateTime('today');
					      //$output .= $from->diff($to)->y;
                                            } else {
					      //                                              $output .= "No";
                                            }
                                          }
					}

					$output .= "\"";
					$output .= ',';

					break;
			}
		} // end patient_dimension
		elseif(strtolower($table_name) == "visit_dimension") { // to-do: visit_dimension
			$output .= "\"\",";
	
		} // end visit_dimension
		else { // concept_dimension
		
			
			$panel_key = $obj->panel;
			switch($obj->dataOption){
				case "Existence (Yes/No)":
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."][1]";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					if(count($results) == 1){
						$output .= "Yes";
					} else {
						$output .= "No";
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "Date (First)":
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."][1]/start_date/text()";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					$formatted_datetime = date('Y-m-d H:i:s', strtotime($results[0]));
					$output .= $formatted_datetime;
					$output .= "\"";
					$output .= ',';
					break;
				case "Date (Most Recent)":
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."][last()]";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					foreach($results as $result){
					  $start_datetime = (string) $result->start_date;
					  $formatted_datetime = date('Y-m-d H:i:s', strtotime($start_datetime));
						$output .= $formatted_datetime;
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "Count":
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){ // only has 1 result, but need to iterate over DOMNodeList
					  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
											'concept_cd' => (string) $result->concept_cd,
											'observer_cd' => (string) $result->observer_cd,
											'start_date' => (string) $result->start_date,
											'instance_num' => (string) $result->instance_num
								 );
					}
					if(count($primary_keys) > 0)
						$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					
					//$primary_keys = array_map("unserialize", array_unique(array_map("serialize", $primary_keys)));
					$output .= "\"" . count($primary_keys) . "\"";
					//$output .= "\"" . count($results) . "\"";
					$output .= ',';
					break;
				case "All Concepts (Names/Text)":
					$names = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					foreach($results as $result){ 
						$names[] = (string) $result->concept_cd["name"];
					}
					$names = array_unique($names);
					foreach($names as $name){
						$output .= '['.$name.'] ';
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "Most Frequent Concept (Names/Text)":
					$names = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){ // only has 1 result, but need to iterate over DOMNodeList
					  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
											'concept_cd' => (string) $result->concept_cd,
											'concept_name' => (string) $result->concept_cd["name"],
											'observer_cd' => (string) $result->observer_cd,
											'start_date' => (string) $result->start_date
								 );
					}
					
					$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					foreach($primary_keys as $result){ 
						$names[] = (string) $result['concept_name'];
					}
					$frequency = array_count_values($names);
					arsort($frequency);
					$counter = 0;
					$max_count = 0;
					
					$output .= "\"";
					foreach($frequency as $key => $count){
						if($counter == 0){
							$max_count = $count;
							$output .= '['.$key.']('.$count.') ';
						} else {
							if($count == $max_count){
								$output .= '['.$key.']('.$count.') ';
							}
						}
						$counter++;
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "All Concepts (Codes)":
					$codes = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					foreach($results as $result){ 
						$codes[] = (string) $result->concept_cd;
					}
					$codes = array_unique($codes);
					foreach($codes as $code){
						$output .= '['.$code.'] ';
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "Most Frequent Concept (Codes)":
					$codes = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){ // only has 1 result, but need to iterate over DOMNodeList
					  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
											'concept_cd' => (string) $result->concept_cd,
											'observer_cd' => (string) $result->observer_cd,
											'start_date' => (string) $result->start_date
								 );
					}
					
					$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					foreach($primary_keys as $result){ 
						$codes[] = (string) $result['concept_cd'];
					}
					$frequency = array_count_values($codes);
					arsort($frequency);
					$counter = 0;
					$max_count = 0;
					
					$output .= "\"";
					foreach($frequency as $key => $count){
						if($counter == 0){
							$max_count = $count;
							$output .= '['.$key.']('.$count.') ';
						} else {
							if($count == $max_count){
								$output .= '['.$key.']('.$count.') ';
							}
						}
						$counter++;
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "Minimum Value":
					$nvals = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					foreach($results as $result){ 
						if(!empty($result->nval_num)){
							$nvals[] = (float) $result->nval_num;
						}
					}
					$output .= min($nvals);
					$output .= "\"";
					$output .= ',';
					break;
				case "Maximum Value":
					$nvals = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$output .= "\"";
					foreach($results as $result){ 
						if(!empty($result->nval_num)){
							$nvals[] = (float) $result->nval_num;
						}
					}
					$output .= max($nvals);
					$output .= "\"";
					$output .= ',';
					break;
				case "Average Value":
					$nvals = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){ // only has 1 result, but need to iterate over DOMNodeList
						if(!empty($result->nval_num)){
						  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
												'concept_cd' => (string) $result->concept_cd,
												'nval_num' => (float) $result->nval_num,
												'observer_cd' => (string) $result->observer_cd,
												'start_date' => (string) $result->start_date,
												'instance_num' => (string) $result->instance_num
									 );
						}
					}
					
					$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					foreach($primary_keys as $result){ 
						$nvals[] = (float) $result['nval_num'];
					}
					$output .= "\"";
					$output .= calculate_average($nvals);
					$output .= "\"";
					$output .= ',';
					break;
				case "Median Value":
					$nvals = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){ // only has 1 result, but need to iterate over DOMNodeList
						if(!empty($result->nval_num)){
						  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
												'concept_cd' => (string) $result->concept_cd,
												'nval_num' => (float) $result->nval_num,
												'observer_cd' => (string) $result->observer_cd,
												'start_date' => (string) $result->start_date,
												'instance_num' => (string) $result->instance_num
									 );
						}
					}
					
					$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					foreach($primary_keys as $result){ 
						$nvals[] = (float) $result['nval_num'];
					}
					$output .= "\"";
					$output .= calculate_median($nvals);
					$output .= "\"";
					$output .= ',';
					break;
				case "List of All Values":
					$vals = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){
						//if(!empty($result->nval_num)){
					  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
												'concept_cd' => (string) $result->concept_cd,
												'nval_num' => (float) $result->nval_num,
												'tval_char' => (string) $result->tval_char,
												'observer_cd' => (string) $result->observer_cd,
												'start_date' => (string) $result->start_date,
												'instance_num' => (string) $result->instance_num,
												'valuetype_cd' => (string) $result->valuetype_cd,
												'observation_blob' => (string) $result->observation_blob
								 );
						//}
					}
					
					$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					foreach($primary_keys as $result){ 
						if($result['valuetype_cd'] == 'B'){
							$vals[] = (string) $result['observation_blob'];
						} else if($result['valuetype_cd'] == 'N'){
							$vals[] = (float) $result['nval_num'];
						} else if($result['valuetype_cd'] == 'T'){
							$vals[] = (string) $result['tval_char'];
						}
					}
					$output .= "\"";
					foreach($vals as $val){
						$output .= '['.(string) $val.'] ';
					}
					$output .= "\"";
					$output .= ',';
					break;
				case "Mode (Most Frequent Value)":
					$vals = array();
					$xpath_query = "//ns2:observation_set[@panel_name='".$panel_key."']/observation[patient_id=".$patient_id."]";
					$results = $doc->xpath($xpath_query);
					$primary_keys = array();
					foreach($results as $result){ // only has 1 result, but need to iterate over DOMNodeList
					  $primary_keys[] = array( 'event_id' => (string) $result->event_id,
												'concept_cd' => (string) $result->concept_cd,
												'nval_num' => (string) $result->nval_num,
												'tval_char' => (string) $result->tval_char,
												'observer_cd' => (string) $result->observer_cd,
												'start_date' => (string) $result->start_date,
												'valuetype_cd' => (string) $result->valuetype_cd,
												'instance_num' => (string) $result->instance_num
								 );
					}
					
					$primary_keys = array_intersect_key($primary_keys, array_unique(array_map('serialize', $primary_keys)));
					foreach($primary_keys as $result){ 
						if($result['valuetype_cd'] == 'N'){
							$vals[] = (string) $result['nval_num'];
						} else if($result['valuetype_cd'] == 'T'){
							$vals[] = (string) $result['tval_char'];
						}
					}

					$frequency = array_count_values($vals);
					arsort($frequency);
					$counter = 0;
					$max_count = 0;
					
					$output .= "\"";
					foreach($frequency as $key => $count){
						if($counter == 0){
							$max_count = $count;
							$output .= '['.(string) $key.']('.$count.') ';
						} else {
							if($count == $max_count){
								$output .= '['.(string) $key.']('.$count.') ';
							}
						}
						$counter++;
					}
					$output .= "\"";
					$output .= ',';
					break;			
			} // end concept_dimension
		}
	}
	$output = rtrim($output, ',');
	return $output;
	
}


function formatter_CSV_to_HTML($csv){
	/* $csv input:
	"10007073","M","69","White","Yes","Yes","Yes","7","No","1"
	"10015020","F","79","White","Yes","Yes","Yes","5","Yes","2"
	"10005728","M","82","White","Yes","Yes","Yes","8","Yes",""
	"10009455","F","65","White","Yes","Yes","","0","No","0"
	"10010148","F","70","White","Yes","No","Yes","0","Yes","0"
	
	outputs:
	<tr><td>10007073</td><td>M</td><td>69</td><td>White</td><td>Yes</td><td>Yes</td><td>Yes</td><td>7</td><td>No</td><td>1</td></tr>
	*/

	$output = "";
	foreach(preg_split("/((\r?\n)|(\r\n?))/", $csv) as $line){
		$line = substr($line, 1);
		$line = substr($line, 0, -1);
		$output .= "<tr><td>";
		$output .= str_replace("\",\"","</td><td>",$line);
		$output .= "</td></tr>\n";
	} 

	return $output;
}

function arrayUnique($array, $preserveKeys = false) {  
    // Unique Array for return  
    $arrayRewrite = array();  
    // Array with the md5 hashes  
    $arrayHashes = array();  
    foreach($array as $key => $item) {  
        // Serialize the current element and create a md5 hash  
        $hash = md5(serialize($item));  
        // If the md5 didn't come up yet, add the element to  
        // to arrayRewrite, otherwise drop it  
        if (!isset($arrayHashes[$hash])) {  
            // Save the current element hash  
            $arrayHashes[$hash] = $hash;  
            // Add element to the unique Array  
            if ($preserveKeys) {  
                $arrayRewrite[$key] = $item;  
            } else {  
                $arrayRewrite[] = $item;  
            }  
        }  
    }  
    return $arrayRewrite;  
}  

// ENTRY POINT FOR SCRIPT

if(count($argv) > 1){
	$job_id = $argv[1];
	$preview = $argv[2];
}

$logging = $CONFIG['debug_logging'];
$data = _getJob($job_id);
$domain = $data->domain;
$crc_uri = $data->crc_uri . 'pdorequest';
$userid = $data->userid;
$project = $data->project;
$login_password = $data->login_password;
if(property_exists($data, 'rerun_userid') && property_exists($data, 'rerun_login_password')){
	$userid = $data->rerun_userid;
	$login_password = $data->rerun_login_password;
}
$patient_set_size = $data->patient_set_size;
$patient_set_coll_id = $data->patient_set_coll_id;
$filterlist = $data->filterlist;

$observation_set = '<observation_set blob="false" onlykeys="false"/>';

if(empty($filterlist)){
	$observation_set = '';
}

$page_size = 50;

$payload = "";

$event_type = "Download_" . $data->event_type_id . "_" . (($preview)?"PR":"DL") . "_" . $data->patient_set_size . "_" . $data->query_master_id;

$hasConcepts = false;

if(sizeof($data->model->concepts) > 0){
	$hasConcepts = true;
}

if($preview > 0){
  _updateJobStatus($job_id, 'NEW', 'Processing page ' . $preview);
  $cached_payload = $CONFIG['working_directory'] . '/' . $job_id . '.' . $preview; // job_id.page_num
  if(file_exists($cached_payload)){
    $payload = file_get_contents($cached_payload);
  } else {
    $page = $preview - 1;
    $request_xml = _XML_getPDO_fromInputList(1+($page_size*$page),$page_size+($page_size*$page), $event_type);
    $response_xml = _postXML($request_xml);
    $doc = simplexml_load_string($response_xml);
		
    $query = '//patient';
    $result = $doc->xpath($query);
    
    foreach($result as $patient){
      
      $patient_id = $patient->patient_id;
      
      $payload .= _outputRequiredFields_forPatient($patient_id);
      if($hasConcepts){
	$payload .= ',';
	$payload .= _outputConcepts_forPatient($patient_id);
      }
      $payload .= "\r\n";
    }
	
    $payload = rtrim($payload, "\r\n");
    $payload = formatter_CSV_to_HTML($payload);

    // Cache Payload
    $savepage = fopen($CONFIG['working_directory'] . '/' . $job_id . '.' . $preview, "w"); // job_file.page_num
    fwrite($savepage, $payload);
    fclose($savepage);
  }

	// Uncomment to debug preview
	//$payloadfile = fopen('jobs/preview_' . $job_id . '.html', "w");
	//fwrite($payloadfile, $payload);
	//fclose($payloadfile);
	
  _updateJobStatus($job_id, 'PREVIEW', $payload);
	
} else {
	_updateJobStatus($job_id, 'PROCESSING', '0 of '.$patient_set_size.' patients');

	$pages = 1;
	if($patient_set_size > $page_size){
		$pages = ceil($patient_set_size / $page_size);
	}
	
	for($page=0;$page<$pages;$page++){
		$data = _getJob($job_id);
		$status = $data->status;
		if($status == 'PROCESSING'){
			$request_xml = _XML_getPDO_fromInputList(1+($page_size*$page),$page_size+($page_size*$page), $event_type);
			$response_xml = _postXML($request_xml);
			
			$doc = simplexml_load_file($CONFIG['working_directory'] . '/' . "response_".$job_id.".xml", 'SimpleXMLElement', LIBXML_PARSEHUGE);

			$page_query = '//patients_returned_first';
			$page_result = $doc->xpath($page_query);
			
			$query = '//patient';
			$result = $doc->xpath($query);

			if($page == 0){
				$payload .= _outputRequiredFields_header();
				$payload .= ',';
				$payload .= _outputConcepts_header() . "\r\n";
			}
			foreach($result as $patient){
			
				$patient_id = $patient->patient_id;
				
				$payload .= _outputRequiredFields_forPatient($patient_id);
				$payload .= ',';
				$payload .= _outputConcepts_forPatient($patient_id);
				$payload .= "\r\n";
			}		
			//handle paging
			if(!empty($page_result)){
				$patients_requested_from = 1+($page_size*$page);		// 51
				$patients_requested_to = $page_size+($page_size*$page);	// 100	
				$patients_returned_to = $page_result[0]['last_index'];	// 68
				//get attributes
				
				for($single_patient=$patients_returned_to+1;$single_patient<=$patients_requested_to;$single_patient++){ //69 to 100
					$data = _getJob($job_id);
					$status = $data->status;
					if($status == 'PROCESSING'){
						$request_xml = _XML_getPDO_fromInputList($single_patient,$single_patient, $event_type);
						$response_xml = _postXML($request_xml);
						
						$doc = simplexml_load_file($CONFIG['working_directory'] . '/' . "response_".$job_id.".xml", 'SimpleXMLElement', LIBXML_PARSEHUGE);
						
						$query = '//patient';
						$result = $doc->xpath($query);

						if($page == 0){
							$payload .= _outputRequiredFields_header();
							$payload .= ',';
							$payload .= _outputConcepts_header() . "\r\n";
						}
						foreach($result as $patient){
						
							$patient_id = $patient->patient_id;
							
							$payload .= _outputRequiredFields_forPatient($patient_id);
							$payload .= ',';
							$payload .= _outputConcepts_forPatient($patient_id);
							$payload .= "\r\n";
						}	
						
						$data = _getJob($job_id);
						$status = $data->status;
						if($status == 'PROCESSING'){ // check if job was cancelled mid-process
							_updateJobStatus($job_id, 'PROCESSING', $single_patient . " of ".$patient_set_size . ' patients');
						}
					}
					if($status == 'CANCELLED'){
						exit();
					}
				}
			} else {
				$data = _getJob($job_id);
				$status = $data->status;
				if($status == 'PROCESSING'){ // check if job was cancelled mid-process
					_updateJobStatus($job_id, 'PROCESSING', ($page_size*($page+1)) . " of ".$patient_set_size . ' patients');
				}
			}
			
		}
		if($status == 'CANCELLED'){
			exit();
		}

	}
	$payload = rtrim($payload, "\r\n");
	$payloadfile = fopen($CONFIG['working_directory'] . '/csv_' . $job_id . '.csv', "w");
	fwrite($payloadfile, $payload);
	fclose($payloadfile);
	
	_updateJobStatus($job_id, 'FINISHED', 'Download is Ready');
}

?>
