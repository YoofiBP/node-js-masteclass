const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");

const server = http.createServer((req, res) => {
  //Get url and parse
  const parseUrl = url.parse(req.url, true);

  //Get path from url
  const path = parseUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, ""); //remove trailing and starting slashes

  //Get the querystring as an object
  const queryString = JSON.stringify(parseUrl.query);

  //Get the HTTP Method
  const method = req.method.toLowerCase();

  //Get headers as object
  const headers = req.headers;

  //Get payload if theres any
  const decoder = new StringDecoder("utf-8");
  let buffer = ""; //will hold stream of payload data

  req.on("data", (data) => {
    //append new data to buffer store
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    //Choose the handler the request should go to or Notfound
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    //Construct data object to send to handler
    const data = {
      trimmedPath,
      queryString,
      method,
      headers,
      payload: buffer,
    };

    //Route the request to the handler specified
    chosenHandler(data, (statusCode, payload) => {
      //use the status code called by the handler or default to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;

      //use the payload  called back by the handler or default to {}
      payload = typeof payload === "object" ? payload : {};
      //convert payload to a string
      payloadString = JSON.stringify(payload);

      //send the response
      res.writeHead(statusCode);
      res.end(payloadString);

      //Log request
      console.log(statusCode, payload);
    });
  });
});

//start server

server.listen(3000, () => {
  console.log(`Server listening on port 3000`);
});

//Define handlers
const handlers = {
  sample(data, callback) {
    //callback HTTP status code and payload
    callback(406, { name: "sampleHandler" });
  },
  notFound(data, callback) {
    callback(404);
  },
};

//Define a route
const router = {
  sample: handlers.sample,
};
