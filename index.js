const mysql = require('mysql');
const request = require('request');
const cheerio = require('cheerio');
const geoip = require('geoip-lite');
const cla = require('command-line-args');
const prompt = require('prompt');
const async = require('async');

//CREATE TABLE visitors (ip VARCHAR(15) NOT NULL, time TIMESTAMP NOT NULL);
const select_query = "SELECT DISTINCT ip, time FROM `visitors` GROUP BY (`ip`);";

//CREATE TABLE results (ip VARCHAR(15) NOT NULL, time TIMESTAMP NOT NULL, title VARCHAR(64), country CHAR(2));
const insert_query = "INSERT INTO `results` (`ip`, `time`, `title`, `country`) VALUES (?, ?, ?, ?);";

function checkService(entry) {
  request({
    uri: "http://" + entry.ip,
    method: "GET",
    timeout: 15000
  }, function(err, response, body) {
    if (response && response.statusCode == 200) {
      const $ = cheerio.load(body);
      entry.title = $('title').text();
      entry.country = geoip.lookup(entry.ip).country;

      con.query(insert_query, [
        entry.ip, 
        entry.time, 
        entry.title,
        entry.country
      ], function(err, response) {
        if (err) throw err;
        console.log("Found http server running at " + entry.ip);
      });
    }
  });
}

console.log("Connecting to the database...");
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  port: 3306,
  password: "yourpassword",
  database: "visitors"
});

con.connect(function (err) {
  console.log("Successfully connected");
});

con.query(select_query, function(err, result) {
  if (err) throw err;
  result.forEach(checkService);
});

setTimeout(function() {
  console.log("Enough time has passed, exiting application...");
  process.exit();
}, 20000);
