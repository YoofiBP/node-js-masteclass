const users = require('./users');
//Define index
const sample = (data, callback) => {
    callback(406, { name: "sampleHandler" });
}

const notFound = (data, callback) => {
    callback(404);
}

const ping = (data, callback) => {
    callback(200);
}



const index = {
    sample,
    notFound,
    ping,
    users
};

module.exports = index;