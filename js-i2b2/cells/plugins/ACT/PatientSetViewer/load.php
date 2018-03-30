<?php

  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * load.php
   * Loads Job definition file in JSON
   * @category i2b2
   * @package  PatientSetViewer
   * @author   Nich Wattanasin
   * @version  March 23, 2018
   * @since    April 4, 2016
   */

$CONFIG = include('../../../../../ACT_config.php');

$job_id = $_POST["job_id"];

$job = file_get_contents($CONFIG['working_directory'] . '/' . $job_id . '.job');

$data = json_decode($job);

echo json_encode($data->model->concepts);

?>