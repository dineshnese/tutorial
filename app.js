const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running ");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    PlayerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `select * 
  from player_details;`;
  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachItem) =>
      convertPlayerDbObjectToResponseObject(eachItem)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select *
    from player_details 
    where player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `update 
    player_details
    set player_name='${playerName}'
    where 
    player_id=${playerId};`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `select * 
    from match_details 
    where match_id=${matchId};`;
  const matchDetailsItem = await db.get(matchDetails);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchDetailsItem));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `select * 
    from player_match_score natural join match_details 
    where player_id=${playerId};`;
  const playerMatches = await db.all(getPlayerMatches);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayer = `select 
         player_id ,
	      player_name 
    from player_match_score 
    inner join player_details on player_match_score.match_id=player_details.match_id 
    where match_id=${matchId};`;
  const playerMatch = await db.all(getMatchPlayer);
  response.send(
    playerMatch.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `select player_details.player_id AS playerId,
    player_details.player_name as playerName,
    sum(player_match_score.score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    where player_details.player_id =${playerId};`;
  const playerMatchDetails = await db.get(getPlayerScore);
  response.send(playerMatchDetails);
});

module.exports = app;
