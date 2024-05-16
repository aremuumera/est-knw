import { RequestListener } from 'http';

import file from './file';
import graphql from './graphql';
import { slackWebsocket, slackEvent } from './slack';

// Handle all HTTP requests for both client and API
export const httpHandler: RequestListener = async (request, response) => {
  // If the request is not made to one of the two endpoints, handle it like a static request for a client file
  if (!['/graphql', '/slack'].includes(request.url)) return file(request, response);

  // All API responses are always CORS-enabled with JSON content type
  response.setHeader('Content-Type', 'application/json');

  if (request.headers.origin) {
    response.setHeader('Access-Control-Allow-Credentials', 'true');

    response.setHeader('Access-Control-Allow-Origin', request.headers.origin);

    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  }

  // Pre-flight requests do not need to be processed any further, they only need the CORS headers
  if (request.method === 'OPTIONS') {
    response.writeHead(200);

    return response.end();
  }

  // Load any data sent in the request body
  let chunks = '';

  request.on('data', (chunk: Buffer | string) => {
    chunks += chunk;
  });

  request.on('end', () => {
    // If there was a request body, parse the combined raw data chunks
    let body: any = null;

    try {
      body = chunks.length ? JSON.parse(chunks) : null;
    } catch (e) {
      console.log('JSON parse error of request body', chunks);
    }

    // Web client requests
    if (request.url === '/graphql') return graphql(request, response, body);

    // Slack event requests
    if (request.url === '/slack') return slackEvent(request, response, body);

    response.writeHead(404);

    response.end();
  });
};

// The WebSocket is hooked up to the Slack module
export const wsHandler = slackWebsocket;
