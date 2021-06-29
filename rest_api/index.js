const http = require("http");
const https = require("https");
const url = require("url");
const {StringDecoder} = require("string_decoder");
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

//Instantiating http Server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}

//Instantiating https Server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
})

//start http server
httpServer.listen(config.appEnvironment.httpPort, () => {
    console.log(`HTTP Server listening on port ${config.appEnvironment.httpPort}`);
});

//start https server
httpsServer.listen(config.appEnvironment.httpsPort, () => {
    console.log(`HTTPS Server listening on port ${config.appEnvironment.httpsPort}`)
})

//All server logic for http and https
let unifiedServer = function (req, res) {
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
            payload: helpers.parseJsonToObject(buffer),
        };

        //Route the request to the handler specified
        chosenHandler(data, (statusCode, payload) => {
            //use the status code called by the handler or default to 200
            statusCode = typeof statusCode === "number" ? statusCode : 200;

            //use the payload  called back by the handler or default to {}
            payload = typeof payload === "object" ? payload : {};
            //convert payload to a string
            const payloadString = JSON.stringify(payload);

            //send the response
            res.setHeader('Content-Type', 'application/json'); //set header to return JSON
            res.writeHead(statusCode);
            res.end(payloadString);

        });
    });
}


//Define a route
const router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens
};
