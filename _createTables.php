<?php
exit("Not autorized");
require_once "lib.php";
header("content-type: application/json");
DataClient::init();
if (!DataClient::$dbconn) {
	exit("Error connecting to database: " . DataClient::$last_error);
}
$sql = 'CREATE TABLE ' . DB_PREFIX . '"di_teachers" (
	email VARCHAR (128)' . (!DB_PREFIX ? " PRIMARY KEY" : "") . ',
	first_name VARCHAR (64),
	last_name VARCHAR (64),
  signup_limit VARCHAR (16),
  subject VARCHAR (16),
  room VARCHAR (16)
);';
vdump($sql);
var_dump(DataClient::SendSQLQuery($sql));
$sql = 'CREATE TABLE ' . DB_PREFIX . '"di_meetings" (
  id VARCHAR (8),
	guest VARCHAR (128),
  guest_perms INT,
  host VARCHAR (128),
  datestart VARCHAR (14),
  dateend VARCHAR (14),
  datecreated VARCHAR (14),
  dateedited VARCHAR (14)
);';

var_dump(DataClient::SendSQLQuery($sql));
// $sql = "DROP TABLE \"DI_TEACHERS\";";



exit();
$r = DataClient::SendSQLQuery("INSERT INTO ${DB_PREFIX}\"di_teachers\" (email,first_name,last_name,signup_limit,subject,room) VALUES ($1,$2,$3,$4,$5,$6)",["jsmith@school.org","John","Smith","-1 18:30","PHYSIQUE","S417"]);
vdump($r);