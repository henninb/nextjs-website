import Head from 'next/head'

export default function Baseball() {

  const handleClick = async () => {
    console.log('handle click');

        // const url = new URL('/api/nhl')

    // const params = {
    // };

    // url.search = new URLSearchParams(params).toString();
    const apiResponse = await fetch('/api/mlb', {
          method: 'GET',
          redirect: 'follow',
          headers: {
            "Content-Type": "application/json",
          },
    });
    console.log('apiCall was made.');
    const json = await apiResponse.json();
    console.log(json);
  }

  return (
    <div>
      <Head>
        <title>Baseball</title>
        <meta name="description" content="" />
      </Head>

      <main>
        <h1>Baseball Schedule</h1>
         <button onClick={handleClick}>click</button>
      </main>

      <footer> footer </footer>
    </div>
  )
}
