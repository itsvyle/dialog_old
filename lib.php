<?php
// CONSTANTS:
define("CONST_DB_URL",getenv("DATABASE_URL"));
define("OAUTH_CLIENT_ID",getenv("OAUTH_CLIENT_ID"));
define("OAUTH_SECRET",getenv("OAUTH_SECRET"));
define("OAUTH_REDIRECT_URI","https://dialog.lfny.repl.co/login/google-redirect.php");

define("ROLE_STUDENT",0);
define("ROLE_TEACHER",1);
define("ROLE_ADMIN",2);

// ============ DATABASE NAMES ===========
define("DB_TEACHERS",'"DI_TEACHERS"');
define("DB_TEACHERS_TYPES",[
       "email" => "string",
       "first_name" => "string",
       "last_name" => "string",
       "signup_limit" => "string",
       "subject" => "string",
       "room" => "string"
]);


// ======================================
// =========== DATA CLIENT ==============
// ======================================
class DataClient {
  public static $dbconn = null;
  public static $last_error = null;
  
  private static $init_done = false;
  public static function init() {
    if (self::$init_done) {return;}
    self::$init_done = true;
      
    try {
      self::$dbconn = pg_connect(CONST_DB_URL);
    } catch (Exception $e) {
      self::$last_error = pg_last_error(self::$dbconn);
      self::$dbconn = false;
    }
  }

  public static function SendSQLQuery($sql,$params = []) {
    if (gettype($params) !== "array") {$params = [$params];}
    try {
      $r = pg_query_params(self::$dbconn,$sql,$params);
      return new DataClientQueryResult($r);
    } catch (Exception $e) {
      self::$last_error = pg_last_error(self::$dbconn);
      return new DataClientQueryResult(false);
    }
  }


  public static function SQLEscapeText($str) {
    return pg_escape_string($str);
  }

  public static function close() {
    // pg_close(self::$dbconn);
  }

}

class DataClientQueryResult {
  public $res;
  public $status = 1;
  public $error = null;
  
  public $column_options = null;

  private $num_rows_cache = null;
  private $rows_cache = null;

  public function __construct($res) {
    $this->res = $res;
    if ($res === false) {
      $this->status = 0;
      $this->error = pg_last_error(DataClient::$dbconn);
    }
  }

  public function setColumnType($colname,$type) {
    if (!$this->column_options) {
      $this->column_options = [strtolower($colname) => $type];
    } else {
      $this->column_options[strtolower($colname)] = $type;
    }
    return $this;
  }
  public function setColumnsTypes($cols) {
    foreach($cols as $k => $v) {
      $this->setColumnType($k,$v);
    }
    return $this;
  }

  public function num_rows() {
    if ($this->res === false) {return null;}
    if ($this->num_rows_cache === null) {
      $this->num_rows_cache = pg_num_rows($this->res);
    }
    return $this->num_rows_cache;
  }

  public function mapRow($row) {
    if (!$row) return $row;
    foreach($row as $colname => $val) {
      $k = strtolower($colname);
      if (isset($this->column_options[$k])) {
        switch($this->column_options[$k]) {
          case "json":
            $row[$colname] = json_decode($val,true);
            break;
          case "int":
            $row[$colname] = intval($val);
            break;
          case "bool":
            $row[$colname] = boolval($val);
            break;
        }
      }
    }
    return $row;
  }

  public function fetch_all_rows($mode = PGSQL_ASSOC) {
    if ($this->res === false) {return null;}
    if ($this->rows_cache === null) {
      $this->rows_cache = pg_fetch_all($this->res,$mode);
        if ($this->rows_cache === false) {
            $this->rows_cache = [];
        } else {
            if ($this->column_options) {
                $this->rows_cache = array_map([$this,"mapRow"],$this->rows_cache);
              }
        }
    }
    return $this->rows_cache;
  }

  public function fetch_assoc_row($row_num = null) {
    if ($this->res === false) {return null;}
    if ($this->column_options) {
      return $this->mapRow(pg_fetch_array($this->res,$row_num,PGSQL_ASSOC));
    } else {
      return pg_fetch_array($this->res,$row_num,PGSQL_ASSOC);
    }
  }

  public function fetch_assoc($row_num = null) { //just an alias for fetch_assoc_row
    return $this->fetch_assoc_row($row_num);
  }

  public function fetch_array($row_num = null,$mode = PGSQL_ASSOC) {
    if ($this->res === false) {return null;}
    return pg_fetch_array($this->res,$row_num,$mode);
  }

}

// ======================================
// =========== SECURITY ==============
// ======================================
class Security {

    // Get the url that the user should go to to login
    static public function loginURL($arguments = null) {
        return "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
            "client_id" => OAUTH_CLIENT_ID,
            "redirect_uri" => OAUTH_REDIRECT_URI,
            "response_type" => "code",
            "scope" => "openid profile email",
            "access_type" => "online",
            "state" => $arguments ? http_build_query($arguments) : "",
            // "hd" => "lfny.org"
        ]);
    }

    // Once the user chose google account, pass code associated with redirect to this function to get user data
    static public function loginGetData($code) {
        $url = "https://oauth2.googleapis.com/token";
        $r = Util::webRequest($url,[
            "method" => "POST",
            "json" => true,
            "body"=> http_build_query([
                "client_id" => OAUTH_CLIENT_ID,
                "client_secret" => OAUTH_SECRET,
                "code" => $code,
                "grant_type" => "authorization_code",
                "redirect_uri" => OAUTH_REDIRECT_URI
            ])
        ]);
        if (!$r['status']) {
            return [
                "status" => 0,
                "error" => $r['error']
            ];
        }
        $dat = [
            "email" => null,
            "name" => null,
            "picture" => null,
            "role" => null
        ];

        
        $res = $r['body'];
        if (isset($res['id_token'])) {
            $payload = $res['id_token'];
            $payload = explode(".",$payload)[1];
            $payload = base64_decode($payload);
            if (!($payload = json_decode($payload,true))) {
                return [
                "status" => 0,
                "error" => "Unable to parse data for account"
            ];
            }
            $dat["name"] = $payload['name'];
            $dat['picture'] = $payload['picture'];
            $dat['email'] = $payload['email'];
        } else {
            return [
                "status" => 0,
                "error" => "Unable to fetch data for account"
            ];
        }
        
        return [$r,$dat];
    }
    
}

// ======================================
// =========== UTIL ==============
// ======================================
function vdump($d) {
  header("content-type: text/json");
  var_dump($d);
  exit();
}
function vdumpclass($d) {
  $class = new ReflectionClass($d);
  return vdump($class->getStaticProperties());
}
function jexit($d) {
  header("content-type: text/json");
  echo json_encode($d,JSON_PRETTY_PRINT);
  exit();
}
function XAttributeValue($node,$name,$default = null) {
    return isset($node[$name]) ? strval($node[$name]) : $default;
}
function proper($object,$key,$default = null) {
	return isset($object[$key]) ? $object[$key] : $default;
}

class Util {
  public static $DateFormat = "YmdHis";

  public static function DateToTime($d) {
    $d = substr($d,0,4) . '-' . substr($d,4,2) . '-' . substr($d,6,2);
    $d = strtotime($d);
    return $d;
  }

  public static function isList($arr) {
    if (gettype($arr) !== "array") {return false;}
    if (array() === $arr) return true;
    return !(array_keys($arr) !== range(0, count($arr) - 1));
  }

  public static function randomID($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
  }
  
  /**  * Generates an XML node - call it in the functions as self::XNode(..args)
    * @param {string} $name - The name of the xml node
    * @param {Array<string,string>} [$attrs=[]] - Attributes of the node
    * @param {string} [$content=""] - The inner content of the node. False if asking not to close node, to just get opening tag
  */
  public static function XNode($name,$attrs = [],$content = "") {
    $r = '<' . $name;
    if (gettype($attrs) == "array" || gettype($attrs) == "object") {
      foreach($attrs as $k => $v) {
        if ($v === null) continue;
        if (gettype($k) === "integer") {
          $r .= ' ' . $v . '=""';
        } else {
          $r .= ' ' . $k . '="' . XEscapeAttribute($v) .  '"';
        }
      }
    }
    if ($content === false) return $r . ">";
    if (!$content || $content === "") return $r . "/>";
    $r .= ">" . $content . '</' . $name . '>';
    return $r;
  }
  /**
  * Escape a xml attributes
  * @param {string} $str
  * @returns {string}
  */
  public static function XEscapeAttribute($str) {
    $str = str_replace('<',"&lt;",$str);
    $str = str_replace('&',"&amp;",$str);
    //$str = str_replace('>',"&gt;",$str);
    $str = str_replace('"',"&quot;",$str);
    $str = str_replace("'","&apos;",$str);
    return $str;
  }
  /**
  * Escape a xml text
  * @param {string} $str
  * @returns {string}
  */
  public static function XEscapeText($str) {
    $str = str_replace('<',"&lt;",$str);
    $str = str_replace('&',"&amp;",$str);
    //$str = str_replace('>',"&gt;",$str);
    //$str = str_replace('"',"&quot;",$str);
    //$str = str_replace("'","&apos;",$str);
    return $str;
  }

  public static function parseKeyValues($str) {
    $o = preg_split("/(?<![^\\\\]\\\\),/",$str);
    $fi = [];
    foreach($o as $k => $v) {
      $v = str_replace('\\,', ',', $v);
      $v = preg_split("/(?<![^\\\\]\\\\)=/",$v,2);
      $v[0] = str_replace('\\=', '=', $v[0]);
      $v[1] = str_replace('\\=', '=', $v[1]);
      $fi[$v[0]] = $v[1];
    }
    return $fi;
  }
  public static function convertToKeyValues($object) {
    $r = "";
    foreach($object as $k => $v) {
      if ($r !== "") {$r .= ",";}
      $r .= str_replace([",","="],["\\,","\\="],$k) . "=" . str_replace([",","="],["\\,","\\="],$v);
    }
    return $r;
  }

  public static function includedFiles() {
      return get_included_files();
  }

  public static function cookie($key, $default = null) {
      return array_key_exists($key, $_COOKIE) ? $_COOKIE[$key] : $default;
  }
  public static function request($key, $default = null) {
      return array_key_exists($key, $_REQUEST) ? $_REQUEST[$key] : $default;
  }
  public static function get($key, $default = null) {
      return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
  }
  public static function post($key, $default = null) {
      return array_key_exists($key, $_POST) ? $_POST[$key] : $default;
  }

  public static function redirect($url) {
    header("Location: " . $url);
		die();
		exit();
  }
  public static function IPAddress() {
      return strval(getenv("REMOTE_ADDR"));
  }

  public static function getAuthorizationHeader() {
		foreach(apache_request_headers() as $k => $v) {
			if (trim(strtolower($k)) == "authorization" && $v) {
				return $v;
				break;
			}
		}
		return null;
	}

  public static function JSONParse($str) {
    return json_decode($str,true);
  }

    function webRequest($url,$opts = []) {
    	$headers_ = ["content-type" =>  "application/x-www-form-urlencoded"];
    	if (proper($opts,'headers')) {
    		foreach($opts['headers'] as $k => $v) {$headers_[strtolower($k)] = $v;}
    	}
    	if (proper($opts,"q")) {$url .= "?" . http_build_query($opts["q"]);}
    	if (!proper($opts,"accept_codes")) {$opts['accept_codes'] = [200];}
    	if (proper($opts,"body") && gettype($opts['body']) == "array") {
    		$headers_['content-type'] = "application/json";
    		$opts['body'] = json_encode($opts['body']);
    	}
    	if (proper($opts,"authorization")) {
    		$headers_['authorization'] = $opts['authorization'];
    	}
    	
    	$headers = [];
    	foreach($headers_ as $k => $v) {$headers[] = $k . ': ' . $v;}
    	$method = strtoupper(proper($opts,"method","GET"));
    	
    	$ch = curl_init();
    	curl_setopt($ch, CURLOPT_URL, $url);
    	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    	
    	// this function is called by curl for each header received
    	$response_headers = [];
    	curl_setopt($ch, CURLOPT_HEADERFUNCTION,
    	  function($curl, $header) use (&$response_headers)
    	  {
    		$len = strlen($header);
    		$header = explode(':', $header, 2);
    		if (count($header) < 2) // ignore invalid headers
    		  return $len;
    
    		$response_headers[strtolower(trim($header[0]))][] = trim($header[1]);
    
    		return $len;
    	  }
    	);
    	
    	if (proper($opts,"check_https") === true) {
    		curl_setopt($ch,CURLOPT_SSL_VERIFYPEER,true);
    	}
    	
    	if (proper($opts,'user_agent')) {
    		curl_setopt($ch,CURLOPT_USERAGENT,$opts['user_agent']);
    	}
    	curl_setopt($ch, CURLOPT_TIMEOUT, proper($opts,'timeout',60));
    	
    	curl_setopt($ch,CURLOPT_CUSTOMREQUEST,$method);
    	if (proper($opts,"body")) {
    		curl_setopt($ch, CURLOPT_POSTFIELDS, $opts['body']);
    	}
    	//send the request
    	$result = curl_exec($ch);
    	
    	$http_code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
    	$url = curl_getinfo($ch,CURLINFO_EFFECTIVE_URL);
    	foreach($response_headers as $k => $v) {
    		if (count($v) === 1) {$response_headers[$k] = $v[0];}
    	}
    	
    	curl_close($ch);
    	
    	$res = [
    		"status" => null,
    		"error" => null,
    		"url" => $url,
    		"http_code" => $http_code,
    		"headers" => $response_headers,
    		"body" => $result
    	];
    	if (proper($opts,'json') === true) {
    		try {
    			$res['body'] = json_decode($res['body'],true);
    		} catch (Exception $e) {
    			$res['status'] = 0;
    			$res['error'] = "Could not parse response to json";
    		}
    	}
    	
    	if (in_array($http_code,$opts['accept_codes'])) {
    		if (!$res['error']) {$res['status'] = 1;}
    	} else {
    		$res['status'] = 0;
    		$res['error'] = "Error in HTTP request, got http code " . strval($res['http_code']);
    	}
    	
    	return $res;
    }

}
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    //this is to make sure that the sql errors are caught
    // error was suppressed with the @-operator
    if (0 === error_reporting()) {
        return false;
    }
    
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
},E_WARNING);

function on_shutdown() {
	DataClient::close();
}
function on_shutdown_default() {
  if (function_exists("on_shutdown")) {
    if (on_shutdown() === false) {return;}
  }
}
register_shutdown_function("on_shutdown_default");