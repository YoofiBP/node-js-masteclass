const serviceHandler = require('./utils');
const _data = require('../data');
const config = require('../config');
const helpers = require('../helpers');
const tokens = require('../handlers/tokens');

//Required Check ID
const get = (data, callback) => {

    const token = data.headers.token;

    if(!token){
        return callback(401, {error: "Unauthorized"});
    }

    _data.read('tokens', token, (err, tokenData) => {
        if(err){
            return callback(400, {error: "token does not exist"});
        }

        const tokenInvalid = Date.now() > tokenData.expires;

        if(tokenInvalid){
            return callback(400, {error: "token expired"});
        }

        const { checkID } = JSON.parse(data.queryString);

        _data.read('checks', checkID, (err, checkData) => {
            if(err){
                return callback(404, {error: "check does not exist"})
            }

            tokens.verifyToken(token, checkData.phoneNumber, (tokenVerified) => {
                if(!tokenVerified){
                    return callback(403, {error: "check does not belong to requesting user"})
                }

                callback(200, checkData);
            })


        })
    })

}

//Required data Protocol, Url, Method, Success codes
const post = (data, callback) => {
    const { protocol, url, method, successCodes, timeoutSeconds } = data.payload

    const requestIsValid = protocol && url && method && successCodes && timeoutSeconds;

    if(!requestIsValid){
        return callback(400, {error: "missing required fields"});
    }

    const token = data.headers.token;

    _data.read('tokens', token, (err, tokenData) => {
        if(err){
            return callback(400, {error: 'token does not exist'});
        }

        const tokenInvalid = Date.now() > tokenData.expires;

        if(tokenInvalid){
            return callback(400, {error: "token expired"});
        }

        const tokenUserPhoneNumber = tokenData.phoneNumber;

        //Lookup user data
        _data.read('users', tokenUserPhoneNumber, (err, userData) => {
            if(err){
                return callback(400, {error: "user does not currently exist"});
            }

            if(!userData.checks){
                userData.checks = [];
            }

            const maxChecks = config.appEnvironment.maxChecks;
            const maxChecksExceeded = userData.checks.length >= maxChecks;

            if(maxChecksExceeded){
                return callback(400, {error: `max checks of ${maxChecks} exceeded`})
            }

            const checkID = helpers.createRandomString(20);

            const checkObject = {
                id: checkID,
                phoneNumber: userData.phoneNumber,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
            }

            _data.create('checks', checkID, checkObject, (err) => {
                if(err){
                    return callback(500, {error: "could not create check"});
                }

                userData.checks.push(checkID);

                _data.update('users', userData.phoneNumber, userData, (err) => {
                    if(err){
                        return callback(500, {error: "could not update user"})
                    }

                    callback(200, checkObject);
                })
            })
        })
    })
}

const put = (data, callback) => {
    const token = data.headers.token;

    if(!token){
        return callback(401, {error: "Unauthorized"});
    }

    _data.read('tokens', token, (err, tokenData) => {
        if(err){
            return callback(401, {error: "Unauthorized"})
        }

        const tokenExpired = Date.now() > tokenData.expires;

        if(tokenExpired){
            return callback(400, {error: "Token Expired"})
        }

        const { checkID } = JSON.parse(data.queryString);

        if(!checkID){
            return callback(400, {error: "required fields missing"});
        }

        _data.read('checks', checkID, (err, checkData) => {
            if(err){
                return callback(404, {error: "check does not exist"});
            }

            tokens.verifyToken(token, checkData.phoneNumber, (tokenIsVerified) => {
                if(!tokenIsVerified){
                    return callback(403, {});
                }


                data.payload.id && delete data.payload.id;
                data.payload.phoneNumber && delete data.payload.phoneNumber;

                Object.keys(data.payload).forEach(key => {
                    if(checkData[key]){
                        checkData[key] = data.payload[key];
                    }
                })


                _data.update('checks', checkID, checkData, (err, newCheckData) => {
                    if(err){
                        return callback(500, {error: "error updated check"})
                    }

                    callback(200, newCheckData);
                })
            })
        })
    })
}

const _delete = (data, callback) => {
    const token = data.headers.token;

    if(!token){
        return callback(401, {error: "Unauthorized"});
    }


    _data.read('tokens', token, (err, tokenData) => {
        if(err){
            return callback(400, {error: "token does not exist"});
        }

        const tokenInvalid = Date.now() > tokenData.expires;

        if(tokenInvalid){
            return callback(400, {error: "token expired"});
        }

        const { checkID } = JSON.parse(data.queryString);

        if(!checkID) {
            return callback(400, {error: "missing required fields"})
        }

        _data.read('checks', checkID, (err, checkData) => {
            if(err){
                return callback(404, {error: "check does not exist"})
            }

            tokens.verifyToken(token, checkData.phoneNumber, (tokenVerified) => {
                if(!tokenVerified){
                    return callback(403, {error: "check does not belong to requesting user"})
                }

                _data.delete('checks', checkID, (err) => {
                    if(err){
                        return callback(500, {error: "error deleting check"})
                    }

                    _data.read('users', checkData.phoneNumber, (err, userData) => {
                        if(err){
                            return callback(400, {error: "user does not exist"});
                        }

                        const newUserData = {...userData, checks: userData.checks.filter(check => check !== checkID)}

                        _data.update('users', userData.phoneNumber, newUserData, (err) => {
                            if(err){
                                callback(500, {error: 'error occurred while updating'});
                            }

                            callback(200);
                        })
                    })
                })
            })


        })
    })
}

const _methodHandler = {
    get,
    post,
    put,
    delete: _delete
}

const checks = serviceHandler(_methodHandler);

module.exports = checks;