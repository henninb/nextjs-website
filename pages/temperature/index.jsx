import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

export default function Temperature() {
  const [data, setData] = useState(null);
  const [fahrenheitState, setFahrenheitState] = useState({
    fahrenheit: 50,
    celsius: 0,
  });

  const [celsiusState, setCelsiusState] = useState({
    fahrenheit: 0,
    celsius: 18,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");

  function handleFahrenheitChange(event) {
    setFahrenheitState({
      ...fahrenheitState,
      [event.target.name]: event.target.value,
    });
  }

  function handleCelsiusChange(event) {
    setCelsiusState({
      ...celsiusState,
      [event.target.name]: event.target.value,
    });
  }

  async function toFahrenheit(event) {
    event.preventDefault();
    const apiResponse = await fetch("/api/fahrenheit", {
      method: "POST",
      body: JSON.stringify(celsiusState),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await apiResponse.text();
    setModalContent(result);
    setModalVisible(true);
  }

  async function toCelsius(event) {
    event.preventDefault();
    const apiResponse = await fetch("/api/celsius", {
      method: "POST",
      body: JSON.stringify(fahrenheitState),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await apiResponse.text();
    setModalContent(result);
    setModalVisible(true);
  }

  const fetchWeather = useCallback(async () => {
    const apiResponse = await fetch("/api/weather", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await apiResponse.json();
    setData(json.observations[0]);
  }, []);

  function displayWeather(weather) {
    return (
      <div>
        Weather observation time: {weather.obsTimeLocal} <br />
        Weather temperature: {weather.imperial.temp} <br />
        Weather windchill: {weather.imperial.windChill} <br />
        Weather pressure: {weather.imperial.pressure} <br />
      </div>
    );
  }

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div>
      <Head>
        <title>Temperature</title>
        <meta name="description" content="" />
      </Head>

      <main>
        <h1>Temperature</h1>

        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6 mt-4">
              <div className="card">
                <h3 className="card-header text-center">
                  Fahrenheit to Celsius
                </h3>
                <div className="card-body">
                  <div className="version-bulk-form indented">
                    <form
                      action="/api/weather"
                      acceptCharset="UTF-8"
                      data-remote="true"
                      method="post"
                    >
                      <div className="form-inline">
                        <div className="input-group col">
                          <input
                            type="number"
                            name="fahrenheit"
                            id="fahrenheit"
                            min="-500"
                            max="500"
                            placeholder="Temperature in fahrenheit"
                            defaultValue="50"
                            className="form-control text-right"
                            onChange={handleFahrenheitChange}
                          />
                          <div className="input-group-append">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={toCelsius}
                              id="amount1-btn"
                            >
                              Calculate
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                    <div id="version1-bulk-result"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mt-4">
              <div className="card">
                <h3 className="card-header text-center">
                  Celsius to Fahrenheit
                </h3>
                <div className="card-body">
                  <div className="version-bulk-form indented">
                    <form
                      name="temperature-to-fahrenheit"
                      action="/api/weather"
                      data-remote="true"
                      method="post"
                    >
                      <div className="form-inline">
                        <div className="input-group col">
                          <input
                            type="number"
                            name="celsius"
                            id="celsius"
                            min="-500"
                            max="500"
                            placeholder="degrees celsius"
                            defaultValue="18"
                            className="form-control text-right"
                            onChange={handleCelsiusChange}
                          />
                          <div className="input-group-append">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={toFahrenheit}
                              id="amount4-btn"
                            >
                              Calculate
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                    <div id="version4-bulk-result"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h1>Weather in Minneapolis</h1>
        {data ? displayWeather(data) : null}

        {modalVisible && (
          <div className="modal" style={modalStyles}>
            <div className="modal-content" style={modalContentStyles}>
              <span
                className="close-button"
                style={closeButtonStyles}
                onClick={() => setModalVisible(false)}
              >
                &times;
              </span>
              <div>{modalContent}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const modalStyles = {
  position: "fixed",
  zIndex: 1,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
  overflow: "auto",
  backgroundColor: "rgb(0,0,0)",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalContentStyles = {
  backgroundColor: "#fefefe",
  padding: "20px",
  border: "1px solid #888",
  width: "80%",
  maxWidth: "500px",
};

const closeButtonStyles = {
  color: "#aaa",
  float: "right",
  fontSize: "28px",
  fontWeight: "bold",
  cursor: "pointer",
};
