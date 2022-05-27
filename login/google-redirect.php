<?php
    require_once $_SERVER['DOCUMENT_ROOT'] . "/lib.php";
    $retry = '<br><a href="/login">Click here to retry</a>';
    
    if ($error = Util::get("error")) {
        echo "Error logging in: " . $error . $retry;
        exit();
    }

    if (!isset($_GET['code']) || !($code = $_GET['code'])) {exit("Error: missing 'code'  argument" . $retry);}

    $dat = Security::loginGetData($code);
    vdump($dat);