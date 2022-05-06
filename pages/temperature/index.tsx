import Head from 'next/head'
import {useEffect, useState} from 'react'

export default function Temperature() {
    const [fahrenheitState, setFahrenheitState] = useState({
        fahrenheit: 0,
        celsius: 0
    });

    const [celsiusState, setCelsiusState] = useState({
        fahrenheit: 0,
        celsius: 0
    });


    function handleFahrenheitChange(event) {
        if (event.target.files) {
            setFahrenheitState({...fahrenheitState, [event.target.name]: event.target.files[0]});
        } else {
            setFahrenheitState({...fahrenheitState, [event.target.name]: event.target.value});
        }
    }

    function handleCelsiusChange(event) {
        if (event.target.files) {
            setCelsiusState({...celsiusState, [event.target.name]: event.target.files[0]});
        } else {
            setCelsiusState({...celsiusState, [event.target.name]: event.target.value});
        }
    }

    async function toFahrenheit(event) {
        event.preventDefault()
        //let celsius = document.getElementById("celsius").innerText
        //console.log(celsius);
        console.log(`fahrenheit=${JSON.stringify(celsiusState)}`);

        const apiResponse = await fetch('/api/fahrenheit', {
            method: 'POST',
            body: JSON.stringify(celsiusState),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const result = await apiResponse.text();
        console.log(result);
    }

    async function toCelsius(event) {
        event.preventDefault()
        //let formData = new FormData();

        console.log(`fahrenheit=${JSON.stringify(fahrenheitState)}`);

        //let fahrenheit = document.getElementById("fahrenheit").innerText
        //console.log(`fahrenheit=${fahrenheit}`);
        //let data = {fahrenheit: fahrenheit};
        // const formData = new FormData(event.target);
        // console.log("f=" + formData.get('fahrenheit'));
        // Now you can use formData.get('foo'), for example.

        const apiResponse = await fetch('/api/celsius', {
            method: 'POST',
            body: JSON.stringify(fahrenheitState),
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
                <meta name="description" content=""/>
            </Head>

            <main>
                <h1>Temperature</h1>

                <div>
                    <form name="temperature-input">
                        <label>fahrenheit</label>
                        <input type="text" name="fahrenheit" id="fahrenheit" onChange={handleFahrenheitChange}/>
                        <button onClick={toCelsius}>toCelsius</button>
                    </form>

                    <form name="temperature-input">
                        <label>celsius</label>
                        <input type="text" name="celsius" id="celsius" onChange={handleCelsiusChange}/>
                        <button onClick={toFahrenheit}>toFahrenheit</button>
                    </form>
                </div>

            </main>

        </div>
    )
}
