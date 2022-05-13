export default async function Celsius(request, response) {

    function toCelsius(x) {
        return ((5.0/9.0) * (x - 32.0));
    }

    function toFahrenheit(x) {
        return  x * (9.0/5.0) + 32.0;
    }

    // const token = request.headers.get('authorization')?.split(" ")[1] || '';
    // console.log(token);

    // const url = new URL('https://api.weather.com/v2/pws/observations/current')
    //
    // const params = {
    //     apiKey: "e1f10a1e78da46f5b10a1e78da96f525",
    //     units: "e",
    //     stationId: "KMNCOONR65",
    //     format: "json"
    // };
    //
    // url.search = new URLSearchParams(params).toString();
    // const apiResponse = await fetch(url.toString(), {
    //     method: 'GET',
    //     redirect: 'follow',
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    // });
    // const json = await apiResponse.json();
    // console.log(json);
    response.status(200).json("{}")
}