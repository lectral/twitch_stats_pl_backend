var express = require("express");
var app = express();

var mysql = require("mysql");
//Database connection
var connection = mysql.createConnection({
    host     : process.env.TWITCH_STATS_BACKEND_DB_HOST,
    user     : TWITCH_STATS_BACKEND_DB_USER,
    password : TWITCH_STATS_BACKEND_DB_PASSWORD,
    database : TWITCH_STATS_BACKEND_DB,
    port: '3306'
  });

connection.connect(function(err) {
    if (err) throw err
    console.log('You are now connected...')
})

app.get("/games", (req, res, next) => {
  connection.query('SELECT * FROM games g INNER JOIN games_cache c ON g.game_id = c.game_id', function(error,results,fields) {
    if (error) throw error;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(results))

  });
});

app.listen(4000, () => {
   console.log("Server running on port 4000");
});
