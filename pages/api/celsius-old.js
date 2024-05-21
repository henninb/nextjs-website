export const runtime = 'edge';

export default async function Celsius(request, response) {
  const { fahrenheit } = request.body;

  if (!fahrenheit) {
    return response.status(400).json({ error: 'fahrenheit temperature is required' });
  }

  function toCelsius(x) {
      return ((5.0/9.0) * (x - 32.0));
  }

  function toFahrenheit(x) {
      return  x * (9.0/5.0) + 32.0;
  }

  const celsius = toCelsius(fahrenheit);

    response.status(200).json({celsius});
}
