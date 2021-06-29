const serviceHandler = require('./utils');
const _data = require('../data');
const helpers = require('../helpers')

//Required data tokenIUD
const get = (data, callback) => {
    const {token} = JSON.parse(data.queryString);

    if (!token) {
        return callback(400, {error: 'token required'});
    }

    _data.read('tokens', token, (err, tokenData) => {
        if (err) {
            return callback(400, {error: 'token does not exist'})
        }

        const tokenExpired = Date.now() > tokenData.expires;

        if (tokenExpired) {
            return callback(400, {error: 'token expired'})
        }

        callback(200, tokenData);
    })
}

//Required data: phoneNumber, password
const post = (data, callback) => {
    const phoneNumber = typeof (data.payload.phoneNumber) === 'string' && data.payload.phoneNumber.trim().length === 10 ? data.payload.phoneNumber.trim() : false;
    const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phoneNumber && password) {
        //Lookup user with phone number
        _data.read('users', phoneNumber, (err, userData) => {
            if (err) {
                return callback(400, {error: "user does not exist"});
            }
            //Compare passwords in user object
            const hashedPassword = helpers.hash(password);
            const payloadMatchesUserPassword = hashedPassword === userData.password;

            if (!payloadMatchesUserPassword) {
                return callback(401, {error: "incorrect credentials"});
            }

            //Create tokens with phoneNumber and password
            const tokenID = helpers.createRandomString(20);
            const expires = helpers.generateTokenExpiration();

            const token = {
                tokenID,
                expires,
                phoneNumber
            }

            //Store the tokens
            _data.create('tokens', tokenID, token, (err) => {
                if (err) {
                    return callback(500, {error: "error creating tokens"})
                }
                callback(200, token);
            })

        })

    } else {
        callback(400, {error: "Missing required fields"});
    }
}

//Required data tokenID, extend
const put = (data, callback) => {
    const {token, extend} = JSON.parse(data.queryString);

    const requiredFieldsPresent = token && extend

    if (!requiredFieldsPresent) {
        return callback(400, {error: 'missing required data'});
    }

    _data.read('tokens', token, (err, tokenData) => {
        if (err) {
            return callback(400, {error: "specified token does not exist"});
        }

        const tokenInvalid = Date.now() > tokenData.expires;

        if (tokenInvalid) {
            return callback(400, {error: 'Token expired'});
        }

        const newTokenData = {...tokenData, expires: helpers.generateTokenExpiration()}

        _data.update('tokens', token, newTokenData, (err, data) => {
            if (err) {
                return callback(500, {error: "error updating token"});
            }

            callback(200, data);
        })
    })


}

//Required tokenID
const _delete = (data, callback) => {
    const {token} = JSON.parse(data.queryString);

    if(!token){
        return callback(400, {error: "missing required fields"});
    }

    _data.read('tokens', token, (err, tokenData) => {
        if(err){
            return callback(400, {error: "token does not exist"});
        }

        _data.delete("tokens", token, (err) => {
            if(err){
                return callback(500, {error: "error deleting token"});
            }

            callback(200, {success: "token deleted successfully"})
        })
    })
}

const _methodHandler = {
    get,
    post,
    put,
    delete: _delete
}

const tokens = serviceHandler(_methodHandler);

tokens.verifyToken = (tokenID, phoneNumber, callback) => {
    _data.read('tokens', tokenID, (err, tokenData) => {
        if(err) {
            callback(false)
        }

        const tokenIsForPhoneNumber = tokenData.phoneNumber === phoneNumber;
        const tokenIsValid = tokenData.expires > Date.now();

        if(tokenIsForPhoneNumber && tokenIsValid){
            callback(true);
        }else{
            callback(false)
        }
    })
}

module.exports = tokens;