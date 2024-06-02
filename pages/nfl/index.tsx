import Head from "next/head";
import { useEffect, useState } from "react";

export default function Football() {
  const [data, setData] = useState(null);

  function generateTable(games) {
    const rows = games.map((game, index) => {
      return (
        <tr>
          <td>{index}</td>
          <td>{game.gameDate}</td>
          <td>{game.teams.away.team.name}</td>
          <td>{game.teams.home.team.name}</td>
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
            <th>HomeTeam</th>
            <th>AwayTeam</th>
            <th>Status</th>
          </tr>
          {rows}
        </table>
      </div>
    );
  }

  // const loadSchedule = async () => {
  //     console.log('handle click');
  //
  //     const apiResponse = await fetch('/api/mlb', {
  //         method: 'GET',
  //         redirect: 'follow',
  //         headers: {
  //             "Content-Type": "application/json",
  //         },
  //     });
  //     console.log('apiCall was made.');
  //     const json = await apiResponse.json();
  //     let games = [];
  //     //let games: any[] = [];
  //     Object.entries(json.dates).forEach((entry) => {
  //         const [, value] = entry;
  //         games.push(value["games"])
  //     });
  //     console.log(games.flat());
  //     setData(games.flat());
  // }

  useEffect(() => {
    if (!data) {
      //loadSchedule();
    }
  }, []);

  return (
    <div>
      <Head>
        <title>Football</title>
        <meta name="description" content="" />
      </Head>

      <main>
        <h1>Football Schedule</h1>

        {data ? generateTable(data) : null}
      </main>
    </div>
  );
}
