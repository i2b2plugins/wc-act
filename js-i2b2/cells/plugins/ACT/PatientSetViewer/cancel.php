<?php
  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * cancel.php
   * Cancels a worker process runs on seperate thread to generate table from i2b2 PDO
   * @category i2b2
   * @package  PatientSetViewer
   * @author   Nich Wattanasin
   * @version  March 23, 2018
   * @since    April 4, 2016
   */

$config = include('../../../../../ACT_config.php');

function _getJob($job_id) {
  global $config;
  $file = file_get_contents($config['working_directory'] . '/' . $job_id . '.job');
  return json_decode($file);
}

function _updateJobStatus($job_id, $status, $payload){
  global $config;
  $data = _getJob($job_id);
  $data->status = $status;
  $data->payload = $payload;
  
  $jobfile = fopen($config['working_directory'] . '/' . $job_id . '.job', "w");
  fwrite($jobfile, json_encode($data));
  fclose($jobfile);

}

$job_id = $_POST["job_id"];

$job_data = _getJob($job_id);// original data

if($job_data->status == 'FINISHED'){
  print "Job has already completed and ready to download.";
} else {
  _updateJobStatus($job_id, 'CANCELLED', 'Job has been cancelled by user');
  print "Job has been cancelled.";
}


?>