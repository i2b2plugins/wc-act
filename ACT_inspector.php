<?php
  /**
   * Copyright (c) 2006-2018 Massachusetts General Hospital
   * All rights reserved. This program and the accompanying materials
   * are made available under the terms of the i2b2 Software License v2.1
   * which accompanies this distribution.
   *
   * ACT_inspector.php
   * Collection of functions that test various dependencies for ACT plugins
   * @category ACT
   * @package  Validator
   * @author   Jay Tarantino
   * @version  March 30, 2018
   */

define("ACT_CONFIG","ACT_config.php");

define("DEFAUT_SHRINE_URL","your_SHRINE_URL_here");
define("DEFAUT_WORKING_DIRECTORY","your_working_directory_here");
define("MIN_DRIVE_SPACE",500000000.00);
define("MIN_PHP_VERSION",5.1);

//WARNING:  if there is a parse error in ACT_config.php, then this script will fatal error. PHP does not
//have a good way of catching this or testing for this.  If there is a parse error, the .fail() of
//the AJAX call on the client will handle. 
try 
{
  $ACT_configs = include(ACT_CONFIG);  
}
catch(Exception $e) 
{
   echo 'Issue with config file ' . $e;
}




class Wiki 
{
  public $URL = '';
  public $title = '';  

  public function link() 
  {
    return '<a href="'. $this->URL .'" target="_blank" title="' . $this->title . '" >more info</a>';

  }
}
  


class TestResults 
{
  public $fail = false;
  public $message = 'ok';
  public $wiki;

  public function __construct()
  {
      $this->wiki = new Wiki;   
  }

}






//Config testing Section
/********************************************************** */

//Parent medthod call all methods needed for a quick confirm that all config entries are there
function testACT_config()
{  
  $error = false;
  $errLst = array();

  $checkConfigResults = testACT_config_SHRINE_URL();
  if (! empty($checkConfigResults))
  {
    $error = true;
    array_push($errLst, $checkConfigResults);
  }
  
  $checkConfigResults = testACT_config_working_directory();
  if (! empty($checkConfigResults))
  {
    $error = true;
    array_push($errLst, $checkConfigResults);
  }  
 
  
  $results = createJSON_response($error, $errLst);
    return $results;
}

//Checking for a valid SHRINE Adptr. URL: that is not blank, not an example, etc.
function testACT_config_SHRINE_URL()
{
  try{    
    global $ACT_configs;
    if(! $ACT_configs)
      return 'Unable to open the ACT Config File for SHRINE value';
  
    $url = $ACT_configs['shrine_url'];

    if(empty($url))
      return 'The \\"shrine_url\\" value is missing. \\nThis value should contain your SHRINE Adptr. URL\\n';
    
    if(stripos($url,'http') != 0)
      return 'Invalid SHRINE URL in the \\"shrine_url\\" value: missing protocol\\n';

      if(! stripos($url,'rest/i2b2/admin/request'))
        return 'Invalid SHRINE URL in the \\"shrine_url\\" value.\\nmissing: \\"rest/i2b2/admin/request\\" \\n';

      if($url == DEFAUT_SHRINE_URL)
        return 'Invalid SHRINE URL in the \\"shrine_url\\" value.\\nDefault URL is not a valid SHRINE URL \\n';
  
 
    return '';
  }
  catch (Exception $e)
  {
    return "Error parsing ACT config File for SHRINE URL: " . $e;
  }


}


//Checking for a valid working directory: that is not blank, not an example, etc.
function testACT_config_working_directory()
{
  try{    
    global $ACT_configs;
    if(! $ACT_configs)
      return 'Unable to open the ACT Config File for working directory value';
  
    $dir = $ACT_configs['working_directory'];

    if(empty($dir))
      return 'The \\"working_directory\\" value is missing. \\nThis value should contain a direcotry path on your web server.\\n';
      
      if($dir == DEFAUT_WORKING_DIRECTORY)
      return 'Invalid Working Directory in the \\"working_directory\\" value.\\nDefault working directory is not a valid working directory \\n';
  
 
    return '';
  }
  catch (Exception $e)
  {
    return 'Error parsing ACT config File for working_directory: ' . $e;
  }


}





//Returns the contents of the config file
function testACT_showACT_Config()
{
  $ret = new TestResults();
  
  try{    
    $ac = file_get_contents(ACT_CONFIG);
    $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/HQbw';
    $ret->wiki->title = 'Opens the ACT Plugin Wiki Troubleshooting page in a new tab';
    if(! $ac)
    {
      $ret->fail = true;      
      $ret->message = 'Unable to open the ACT Config file';
    }
    else
    {     
      $ac = htmlentities($ac);
      $openCodeTag = '<pre id="codeView" style="display:none;" ><code>';
      $closeCodeTag = '</code></pre>';
      
      $ret->message = $openCodeTag . $ac . $closeCodeTag;
     
    }
  
    
  }
  catch (Exception $e)
  {
    $ret->fail = true;    
    $ret->message = 'Error reading the ACT config file: ' . $e;
    return $ret;
  }

  return $ret;

}



//Env tesing Section  for example access permisions, OS version, etc.
/********************************************************** */ 


//Checking for exist of working dir, and if proper permissions etc.
function testACT_check_working_directory()
{
  $ret = new TestResults();

  try 
  {
    $checkConfigResults = testACT_config_working_directory();
    if (empty($checkConfigResults))
    {
      global $ACT_configs;  
      $dir = $ACT_configs['working_directory'];
      $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/QQH6';
      $ret->wiki->title = 'Opens the ACT Plugin Wiki page for working directory in a new tab';
      if(file_exists ($dir))
      {
        if(! is_writable ($dir))
        {
          $ret->fail = true;         
          $ret->message = 'Error: PHP does not have write access to the working directory: ' .$dir;
          return $ret;
        }

      }
      else
      {
        $ret->fail = true;       
        $ret->message = 'Error: The working directory does not exists or is not readable by PHP: ' .$dir;
        return $ret;
      }

    }
    else
    {
      $ret->fail = true;
      $ret->message = 'Error: working_directory entry is missing from the config file or the config file is missing.';
      return $ret;
    }

}
catch (Exception $e)
  {
    $ret->fail = true;
    $ret->message ='Error checking working_directory: ' . $e;
    return $ret;
  }

  $ret->message = $dir . ': ok';
  return $ret;

}

//returns OS name and ver.
function testACT_getOSInfo()
{ 
  $ret = new TestResults();
  
  try
  {  
    $ret->message = php_uname('s') .'|' .  php_uname('r');
    $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/_wfw';
    $ret->wiki->title = 'Opens the ACT Plugin Wiki page for OS info. in a new tab'; 
    return $ret;
  }
  catch (Exception $e)
  {   
    $ret->fail = true;   
    $ret->message = 'Error checking OS : ' . $e;  
    return $ret;
  }


}

//returns return code of a shell command result
function testACT_testSystem_command($cmd)
{ 
  $ret = new TestResults();
  $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/PAH6';
  $ret->wiki->title = 'Opens the ACT Plugin Wiki page for AT command & ATD service in a new tab';
  try
  {  
    system($cmd, $returnCode);
    if($returnCode === 127)
    {
      $ret->fail = true;
      $ret->message = $cmd . ' command not found';
          

      return $ret;
    }
    
  }
  catch (Exception $e)
  {   
    $ret->fail = true;    
    $ret->message = 'Error testing system command : ' . $e;
    return $ret; 
  }

  return $ret;

}

//returns remaining space
function testACT_getFreeSpace()
{ 
  $ret = new TestResults();
  
  try
  {  
    
    global $ACT_configs;  
    $dir = $ACT_configs['working_directory'];
    $freeSpace = 0.00;
    $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/QQH6';
    $ret->wiki->title = 'Opens the ACT Plugin Wiki page for working directory in a new tab';
    
    if(file_exists ($dir))
    {
      $freeSpace = disk_free_space($dir);
      $ret->message = $freeSpace . ' bytes free on ' .$dir;
    }
    else
    {
      $ret->fail = true;
      $ret->message = 'working directory not found ';
      }       
    
    if($freeSpace < MIN_DRIVE_SPACE)
    {
      $ret->fail = true;
      $ret->message = 'working directory is low on space ';
    }

    return $ret;
  }
  catch (Exception $e)
  {   
    $ret->fail = true;
    $ret->message = 'Error checking free space : ' . $e;  
    return $ret;
  }


}


//Tests SHRINE URL to make sure not 404.  Response errors are expected, but not a 404(notfound)
function testACT_SHRINE_URL_found()
{ 
  $ret = new TestResults();
  $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/RQH6';
  $ret->wiki->title = 'Opens the ACT Plugin Wiki page for SHRINE URL in a new tab';
  
  try
  {  
    global $ACT_configs;  
    $url = $ACT_configs['shrine_url'];
   
    $headers = get_headers($url);    

    if(is_null($headers[0]) || strrpos($headers[0],'404'))
    {
      $ret->fail = true;
      $ret->message = $url .' not found';
      
    }
    else
    {
      $ret->message = $url . ' found'; 
    }
    
    return $ret;
  }
  catch (Exception $e)
  {   
    $ret->fail = true;
    $ret->message = 'Error checking SHRINE URL : ' . $e;  
    return $ret;
  }


}



//Software testing Section for example:  php versions, php features: curl, json, etc.
/********************************************************** */

//returns PHP verson and PHP extension info
function testACT_getPHPVersion($feature)
{ 
  $ret = new TestResults();
  $ret->wiki->URL = 'https://community.i2b2.org/wiki/x/-Qfw';
  $ret->wiki->title = 'Opens the ACT Plugin Wiki page for PHP in a new tab';
  try
  {      
    if(strtolower($feature) == 'php')
    {    
      $phpV = phpversion();
      if($phpV > MIN_PHP_VERSION)
      {
        $ret->message = $phpV; 
      }
      else
      {
        $ret->fail = true; 
        $ret->message = 'PHP version ' .$phpV . ' too low';        
      }

    }
    else
    if(strtolower($feature) == 'curl')
    {
      $cURL_info = curl_version();
      if(!empty($cURL_info)) 
      {
        $ret->message = $cURL_info['version'];
      }
      else
      {
        $ret->fail = true;
        $ret->message = 'Error: no cURL info found';        
      }
    }    
    else
     {   
      $pver = phpversion($feature);
      if($pver)
      {
        $ret->message = $pver;
      }
      else
      {
        $ret->fail = true;
        $ret->message =  $feature . ' extension not found';        
      }
     
     } 

  }
  catch (Exception $e)
  {    
    $ret->fail = true; 
    $ret->message = 'Error checking PHP version ' . $feature . ' : ' . $e;     
    return $ret;
  }
  
  return $ret;

}


//Supporting Util Section  TODO: someday make a class, private etc.
/********************************************************** */

// returns a JSON of an error bool, and the errorList array
function createJSON_response($isError, $errorList)
{
  $ret = "";
  
  if(! $isError)
  {
    $ret = '{
      "error": false,
      "errorList": []
    }';
  }
  else
  {
    $ret ='{
      "error": true,
      "errorList": [';

      $size = count($errorList);
      $count = 0;

      foreach ($errorList as $value) {
        $count = $count + 1;
        $ret =  $ret . '"' . $value . '"';
        if($count < $size)
          $ret = $ret . ',';
    }

      $ret =  $ret . ']}';
  }


  return $ret;

}

if(isset($_GET['test'])){
  $message = testACT_config();
  header('Content-Type: application/json', true);
  echo $message;
}

?>