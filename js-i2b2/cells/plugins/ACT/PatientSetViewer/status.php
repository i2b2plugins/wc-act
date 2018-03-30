<?php

  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * status.php
   * Gets Status of Job and returns in JSON
   * @category i2b2
   * @package  PatientSetViewer
   * @author   Nich Wattanasin
   * @version  March 23, 2018
   * @since    April 4, 2016
   */


$CONFIG = include('../../../../../ACT_config.php');

$job_id = $_GET["job_id"];

header('Content-Type: application/json', true);
$jobfile = file_get_contents($CONFIG['working_directory'] . '/' . $job_id . '.job');

echo $jobfile;

?>