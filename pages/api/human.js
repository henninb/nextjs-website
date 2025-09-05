
export default function handler(req) {
  return new Response(JSON.stringify({ message: "Human API disabled" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
