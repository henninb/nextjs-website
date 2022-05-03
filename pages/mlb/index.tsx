import Head from 'next/head'
import { useState, useEffect } from 'react'
export default function Baseball() {
  const [data, setData] = useState(null);

  const loadSchedule = async () => {
    console.log('handle click');

    const apiResponse = await fetch('/api/mlb', {
          method: 'GET',
          redirect: 'follow',
          headers: {
            "Content-Type": "application/json",
          },
    });
    console.log('apiCall was made.');
    const json = await apiResponse.json();
    console.log(json.dates);
    setData(json);

  }

  useEffect(() => {
      if( !data) {
        loadSchedule();
      }
  }, [])

  return (
    <div>
      <Head>
        <title>Baseball</title>
        <meta name="description" content="" />
      </Head>

      <main>
        <h1>Baseball Schedule</h1>
         <button onClick={loadSchedule}>click</button>

        <div id="games-div" />
      </main>

      <footer> footer </footer>
    </div>
  )
}
