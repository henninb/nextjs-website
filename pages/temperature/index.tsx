import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Temperature() {
        async function toFahrenheit(event) {
            event.preventDefault()
            let celsius = document.getElementById("celsius").value;
            console.log(celsius);
            let data = {
                celsius: celsius,
            };


            const apiResponse = await fetch('/api/fahrenheit', {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result = await apiResponse.text();
            console.log(result);
        }

        async function toCelsius(event) {
            event.preventDefault()

            let fahrenheit = document.getElementById("fahrenheit").value;
            console.log(fahrenheit);
            let data = {
                fahrenheit: fahrenheit,
            };
            // const formData = new FormData(event.target);
            // console.log("f=" + formData.get('fahrenheit'));
            // Now you can use formData.get('foo'), for example.

            const apiResponse = await fetch('/api/celsius', {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result = await apiResponse.text();
            console.log(result);
        }

  useEffect(() => {
    // if( !data) {
    //   loadSchedule();
    // }
  }, [])

  return (
    <div>
      <Head>
        <title>Temperature</title>
        <meta name="description" content="" />
      </Head>

      <main>
        <h1>Temperature</h1>

          <div>
              <form name="temperature-input">
                  <label>fahrenheit</label>
                  <input type="text" name="fahrenheit" id="fahrenheit" />
                  <button onClick={toCelsius}>toCelsius</button>
              </form>

              <form name="temperature-input">
                  <label>celsius</label>
                  <input type="text" name="celsius" id="celsius" />
                  <button onClick={toFahrenheit}>toFahrenheit</button>
              </form>
          </div>

      </main>

    </div>
  )
}
