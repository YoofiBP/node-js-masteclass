const crypto = require('crypto');
const config = require('./config');

const hash = (password) => {
    if(password.length > 0){
        return crypto.createHmac('sha256', config.appEnvironment.hashingSecret).update(password).digest('hex');

    } else {
        return false;
    }
}

const parseJsonToObject = (json) => {
    try {
        return JSON.parse(json);
    } catch (e) {
        return {};
    }

}



const helpers = {
    hash,
    parseJsonToObject
}

module.exports = helpers;