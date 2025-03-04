import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Define test server
const server = setupServer(
  http.get('https://api.example.com/test', () => {
    return HttpResponse.json({ success: true, data: { message: 'Hello from MSW' } });
  })
);

// Setup server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MSW Basic Test', () => {
  it('properly mocks API calls', async () => {
    const response = await fetch('https://api.example.com/test');
    const data = await response.json();
    
    expect(data).toEqual({ success: true, data: { message: 'Hello from MSW' } });
  });
});