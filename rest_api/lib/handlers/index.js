const users = require('./users');
const tokens = require('./tokens');

const notFound = (data, callback) => {
    callback(404);
}

const ping = (data, callback) => {
    callback(200);
}



const index = {
    notFound,
    ping,
    users,
    tokens
};

module.exports = index;