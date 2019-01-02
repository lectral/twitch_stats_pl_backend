var express = require("express");
var app = express();

var mysql = require("mysql");
//Database connection
var db_configuration = {
  host     : process.env.TWITCH_STATS_BACKEND_DB_HOST,
  user     : process.env.TWITCH_STATS_BACKEND_DB_USER,
  password : process.env.TWITCH_STATS_BACKEND_DB_PASSWORD,
  database : process.env.TWITCH_STATS_BACKEND_DB,
  port: process.env.TWITCH_STATS_BACKEND_DB_PORT 
}
var connection = mysql.createConnection(db_configuration);

connection.connect(function(err) {
  if (err) throw err
  console.log('You are now connected...')
})


function parseGraphs(graph_data) {
  for(index=0; index < graph_data.length;++index){
    graph_data[index]['graphs'] = JSON.parse(graph_data[index]['graphs']);
  }
  return graph_data; 
}

app.get("/stats", (req, res, next) => {
  connection.query('SELECT * FROM games g INNER JOIN games_cache c ON g.game_id = c.game_id WHERE streams_count > 0 ORDER BY viewer_count DESC', function(error,results,fields) {
    if (error) throw error;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    var parsed = parseGraphs(results)
    res.send(JSON.stringify(parsed))

  });
});

app.get("/games", (req, res, next) => {
  gameId = req.params.gameId
  query = 
    connection.query('SELECT * FROM games_cache ORDER BY title ASC', function(error, results, fields) {
      if (error) throw error;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(JSON.stringify(results))
    });
});


app.get("/games/:gameId", (req, res, next) => {
  gameId = req.params.gameId
  query = 
    connection.query('SELECT DISTINCT user_id, user_name, sum(viewer_count) as total_viewer_count FROM stream WHERE created_on >= NOW() - INTERVAL 1 MONTH AND game_id = ? GROUP BY user_id, user_name ORDER BY total_viewer_count DESC;',gameId, function(error,results,fields) {
      if (error) throw error;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      var response = { 
        'title' : '',
        'graphs' : [],
        'streamers' : results,
      } 

      connection.query('SELECT * FROM games g INNER JOIN games_cache c ON g.game_id = c.game_id WHERE g.game_id=? ORDER BY viewer_count DESC',gameId, function(error, results2, fields){
        if (error) throw error;

        var parsed = parseGraphs(results2) 
        response['title'] = parsed[0]['title'] 
        response['stats'] = parsed[0] 
        res.send(JSON.stringify(response))
      });
    });
});

app.get("/streamers/:streamerId", (req, res, next) => {
  streamerId = req.params.streamerId
  query = 
    connection.query('SELECT COUNT(DISTINCT s.id) as sample_count,s.game_id,s.user_name,c.title from stream s INNER JOIN games_cache c on s.game_id = c.game_id where user_id=? GROUP BY s.game_id, s.user_name ORDER BY sample_count DESC',streamerId, function(error,results,fields) {
      if (error) throw error;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (error) throw error;
      response = {
        'user_name' : results[0].user_name,
        'games' : results
      }
      res.send(JSON.stringify(response))
    });
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
