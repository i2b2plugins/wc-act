<?php

  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * helper.php
   * Helper Script and Entry point for launching worker
   * @category i2b2
   * @package  PatientSetViewer
   * @author   Nich Wattanasin
   * @version  March 23, 2018
   * @since    April 4, 2016
   */

$config = include('../../../../../ACT_config.php');

function _createNewJob($job) {
  global $config;
  $data = json_decode($job);
  $userid = $data->userid;
  $job_id = $userid . '_' . _generate_uuid();
  $jobfile = fopen($config['working_directory'] . '/' . $job_id . '.job', "w");
  fwrite($jobfile, $job);
  fclose($jobfile);
  return $job_id; // nw096_da6808d5-c888-4ed8-88d7-1ffb0ccf8c0e
}

function _getJobID($job){
  $data = json_decode($job);
  // To-do: check if job exists on filesystem
  return $data->id;
}

function _generate_uuid() {
  return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
		  mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
		  mt_rand( 0, 0xffff ),
		  mt_rand( 0, 0x0fff ) | 0x4000,
		  mt_rand( 0, 0x3fff ) | 0x8000,
		  mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
		  );
}

$job = $_POST['job'];
$preview = $_POST['preview']; // 1 or 0

if($preview == 0){
  if(isset($_POST['job_id'])){
    $job_id = _getJobID($job);
  } else {
    $job_id = _createNewJob($job);
  }
} else {
  if(isset($_POST['job_id'])){
    $job_id = $_POST['job_id'];
  } else {
    $job_id = _createNewJob($job);
  }
}

echo $job_id;


// Background Work Starts Here


// process
//$com = new Com('WScript.shell');
//$com->run('php worker_sxe.php '. $job_id . ' ' . $preview, 10, false);

exec('echo "php -q worker_sxe.php ' . $job_id . ' ' . $preview . '" | SHELL=/bin/bash at now 2>&1', $out);


?>