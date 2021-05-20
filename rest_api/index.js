const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {

    //Get url and parse
    const parseUrl = url.parse(req.url, true);

    //Get path from url 
    const path = parseUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,''); //remove trailing and starting slashes

    //Get the querystring as an object
    const queryString = JSON.stringify(parseUrl.query)

    //Get the HTTP Method
    const method = req.method.toLowerCase();

    //Get headers as object
    const headers = req.headers;

    //Get payload if theres any

    //send the response
    res.end('Hello world\n')

    //Log request
    console.log(queryString)
    
});

//start server

server.listen(3000, () => {
    console.log(`Server listening on port 3000`)
})