import React, { useEffect, useState } from "react";
import Head from "next/head";

export default function Baseball() {
  const [data, setData] = useState(null);

  function generateTable(games) {
    const rows = games.map((game, index) => {
      return (
        <tr>
          <td>{index}</td>
          <td>{game.gameDate}</td>
          <td>{game.teams.away.team.name}</td>
          <td>{game.teams.away.score || "-"}</td>
          <td>{game.teams.home.team.name}</td>
          <td>{game.teams.home.score || "-"}</td>
          <td>{game.status.abstractGameState}</td>
        </tr>
      );
    });

    return (
      <div>
        <table>
          <tr>
            <th>ID</th>
            <th>date</th>
            <th>AwayTeam</th>
            <th>AwayScore</th>
            <th>HomeTeam</th>
            <th>HomeScore</th>
            <th>Status</th>
          </tr>
          {rows}
        </table>
      </div>
    );
  }

  const loadSchedule = async () => {
    console.log("handle click");

    const apiResponse = await fetch("/api/mlb", {
      method: "GET",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("apiCall was made.");
    const json = await apiResponse.json();
    let games = [];
    Object.entries(json.dates).forEach((entry) => {
      const [, value] = entry;
      games.push(value["games"]);
    });
    console.log(games.flat());
    setData(games.flat());
  };

  useEffect(() => {
    if (!data) {
      loadSchedule();
    }
  }, []);

  return (
    <div>
      <Head>
        <title>Baseball</title>
        <meta name="description" content="" />
      </Head>

      <main>
        <h1>Baseball Schedule</h1>
        {data ? generateTable(data) : null}
      </main>
    </div>
  );
}
