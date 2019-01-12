/* Handles connection with the database and data retrival */
var mysql = require("mysql");

var db_configuration = {
  host     : process.env.TWITCH_STATS_BACKEND_DB_HOST,
  user     : process.env.TWITCH_STATS_BACKEND_DB_USER,
  password : process.env.TWITCH_STATS_BACKEND_DB_PASSWORD,
  database : process.env.TWITCH_STATS_BACKEND_DB,
  port: process.env.TWITCH_STATS_BACKEND_DB_PORT, 
  debug: ['ComQueryPacket', 'RowDataPocket' ]
}

var connection = mysql.createConnection(db_configuration);

/** 
 * Opens connection to the database
 * @throws mysql exceptions 
*/
export function openConnection() {
  connection.connect(function(err) {
    if (err) throw err
  })
}

/** 
 * Closes the connection 
*/
export function closeConnection() {
  connection.end()
}

/** 
 * Logs db error and executes appropriate callback 
 *
 * @example if(noDbErrors(error, reject) resolve(result) 
 * @param {Object} mysql error object
 * @param {callback} function that handles mysql error
 * @return {Boolean} true if there where no errors
*/
function noDbErrors(error, failure){
  if (error) {
    console.log(error)
    failure(error);
    return false 
  }
  return true
}

/** 
 * Turns json graph data into object 
 *
 * @param {Array} array of json graph data 
 * @return {Array} array of graph data 
*/

function parseGraphs(graph_data) {
  for(var index=0; index < graph_data.length;++index){
    graph_data[index]['graphs'] = JSON.parse(graph_data[index]['graphs']);
  }
  return graph_data; 
}

/**
 * Returns statistics from the games table
 *
 * @return {Promise}
 */
export let stats = () => new Promise((resolve, reject) => {
  connection.query(`SELECT * FROM games g  
  INNER JOIN games_cache c ON g.game_id = c.game_id 
  WHERE streams_count > 0 
  ORDER BY viewer_count DESC`, 
    function(error,results,fields) {
      if(noDbErrors(error, reject)){
        resolve(results);
      }
    })


});

/**
 * Returns array of all processed games 
 *
 * @return {Promise}
 */
export let games = () => new Promise((resolve, reject) => {
  connection.query('SELECT * FROM games_cache ORDER BY title ASC', 
    function(error, results, fields) {
      if(noDbErrors(error, reject)){
        resolve(results);
      }
    });
})

/**
 * Returns stats for given twitch game_id 
 *
 * @param {String} twitch game id
 * @return {Promise}
 */
export let game_stat = (id) => new Promise((resolve, reject) => {
  connection.query(`SELECT * FROM games g 
    INNER JOIN games_cache c ON g.game_id = c.game_id 
    WHERE g.game_id=? 
    ORDER BY viewer_count DESC`, id, function(error, results, fields){
      if(noDbErrors(error, reject)){
        let parsed = parseGraphs(results)
        resolve(parsed[0]) 
      }
    });
})

/**
 * Returns stats (from games table) for given twitch game_id 
 *
 * @param {String} twitch game id
 * @return {Promise}
 */
export let streamers = (id) => new Promise((resolve, reject) => {
  connection.query(`SELECT DISTINCT user_id, user_name, sum(viewer_count) as total_viewer_count 
  FROM stream 
  WHERE created_on >= NOW() - INTERVAL 1 MONTH AND game_id = ? 
  GROUP BY user_id, user_name 
  ORDER BY total_viewer_count DESC;`, id, (error,results,fields) => {
    if(noDbErrors(error, reject)) {
      resolve(results)
    }
  }) 
})

/**
 * Return object with all stats for single twitch game_id 
 *
 * @param {String} twitch game id
 * @return {Promise}
 */
export const game = (id) => new Promise((resolve,reject) =>{
  streamers(id)
    .then( result => result )
    .then( streamers => {
      game_stat(id)
        .then( result => {
          let merged_result = {}
          merged_result['streamers'] = streamers
          merged_result['title'] = result['title']
          merged_result['stats'] = result
          resolve(merged_result)
        })
        .catch(error => reject(error))
    })
    .catch(error => reject(error))
})

/**
 * Return all games streamed by given user_id 
 *
 * @param {String} twitch game id
 * @return {Promise}
 */
export const streamer_games = (id) => new Promise((resolve, reject) => {
  connection.query(`SELECT COUNT(DISTINCT s.id) as sample_count,s.game_id,s.user_name,c.title from stream s 
  INNER JOIN games_cache c on s.game_id = c.game_id 
  WHERE user_id=? 
  GROUP BY s.game_id, s.user_name 
  ORDER BY sample_count DESC`, id, 
    function(error,results,fields) {
      if(noDbErrors(error, reject)) {
        resolve(results) 
      }
    })
})

/**
 * Return top viewed streams for given user_id 
 *
 * @param {String} twitch user id
 * @return {Promise}
 */
export const streamer_top_viewed = (id) => new Promise((resolve, reject) => {
  connection.query(`SELECT s.user_name,s.viewer_count,s.stream_id,
     s.game_id,c.title,s.created_on 
    FROM stream s 
      LEFT JOIN stream s2 
        ON s.stream_id = s2.stream_id AND s.viewer_count < s2.viewer_count 
      JOIN games_cache c ON s.game_id=c.game_id 
    WHERE s2.viewer_count is NULL AND s.user_id = ?`, id,
    function(error,results,fields) {
      if(noDbErrors(error, reject)) {
        resolve(results) 
      }
    });
})

/**
 * Return schedule for given user_id 
 *
 * @param {String} twitch user id
 * @return {Promise} with the result
 */
export const streamer_weekdays = (id) => new Promise((resolve, reject) =>{
  connection.query(`SELECT WEEKDAY(s.created_on) as weekday, 
      count(*) as count, sum(viewer_count) as views 
    FROM stream s 
    WHERE s.user_id = ? 
    GROUP BY weekday`, id, 
    function(error, results, fields) {
      if(noDbErrors(error, reject)) {
        resolve(results)
      }
    });
})


/**
 * Return aggregation of data for single user_id
 *
 * @param {String} twitch_user_id
 * @return {Promise} with the result
 */
export const streamer = (id) => new Promise((resolve, reject) =>{
  let merged_result = {}
  streamer_games(id)
    .then(streamer_games => {
      streamer_top_viewed(id) 
        .then(top_viewed => {
          streamer_weekdays(id)
            .then(weekdays => {
              let result = {}
              result['user_name'] = streamer_games[0].user_name
              result['games'] = streamer_games
              result['top_viewed'] = top_viewed
              result['top_days'] = weekdays 
              resolve(result)
            })
        })
    })
});
