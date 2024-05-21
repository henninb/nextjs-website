export const runtime = 'edge';

export default async function Fahrenheit(request, response) {
  const { celsius } = request.body;

  // Check if Fahrenheit temperature is provided
  if (!celsius) {
    return response.status(400).json({ error: 'celsius temperature is required' });
  }

  function toCelsius(x) {
    return ((5.0/9.0) * (x - 32.0));
  }

  function toFahrenheit(x) {
    return  x * (9.0/5.0) + 32.0;
  }

  // Convert Fahrenheit to Celsius
  // const celsius = (fahrenheit - 32) * (5/9);
  const fahrenheit = toFahrenheit(celsius);

  // Send the result back
  response.status(200).json({ fahrenheit });
}
