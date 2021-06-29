const crypto = require('crypto');
const config = require('./config');


const hash = (password) => {
    if (password.length > 0) {
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

const createRandomString = (stringLength) => {
    stringLength = typeof stringLength === 'number' && stringLength > 0 ? stringLength : false;
    if (!stringLength) {
        return false;
    }

    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let randomString = '';

    for (let i = 0; i < stringLength; i++) {
        const randomIndex = Math.floor(Math.random() * possibleCharacters.length);
        const randomChar = possibleCharacters[randomIndex];
        randomString += randomChar;
    }

    return randomString
}

const generateTokenExpiration = () => Date.now() + 1000 * 60 * 60


const helpers = {
    hash,
    parseJsonToObject,
    createRandomString,
    generateTokenExpiration
}

module.exports = helpers;