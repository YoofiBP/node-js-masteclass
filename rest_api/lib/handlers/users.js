const _data = require('../data');
const helpers = require('../helpers');

const validate = (data) => {
    const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phoneNumber = typeof(data.payload.phoneNumber) === 'string' && data.payload.phoneNumber.trim().length === 10 ? data.payload.phoneNumber.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true;

    return (firstName && lastName && phoneNumber && password && tosAgreement);
}

const post = (data, callback) => {
    //Check all required fields are filled out
    const dataIsValid = validate(data);

    if(dataIsValid){
        const {phoneNumber, password, firstName, lastName, tosAgreement} = data.payload;
        //Make sure that the user does not already exist
        _data.read('users', phoneNumber, (err) => {
            if(err){
                //Hash the password
                const hashedPassword = helpers.hash(password);
                if(!hashedPassword){
                    callback(500, {error: 'Failed to hash password'});
                }
                const user = {
                    firstName,
                    lastName,
                    phoneNumber,
                    password: hashedPassword,
                    tosAgreement
                }

                _data.create('users', phoneNumber, user, (err) => {
                    if(!err){
                        callback(200, user);
                    }else {

                        callback(500, {error: 'Could not create the new user'});
                    }
                }).then().catch();

            } else {
                callback(400, {error: "User already exists"})
            }
        }).then().catch()
    } else {
        return callback(400, {error: 'missing required fields'});
    }
}


//TODO: Allow only authenticated users to make GET request
const get = (data, callback) => {
    let {phoneNumber} = JSON.parse(data.queryString);
    phoneNumber = typeof(phoneNumber) === "string" && phoneNumber.trim().length === 10 ? phoneNumber : false;
    if(!phoneNumber){
        return callback(400, {error: 'required fields not present'})
    }
    _data.read('users', phoneNumber, (err, data) => {
        if(err){
            return callback(400, {error: "user does not exist"});
        }
        //remove password from data
        data.password && delete data.password;
        callback(200, data);
    }).then().then();
}

const put = (data, callback) => {
    const queryString = JSON.parse(data.queryString);
    const queryPhoneNumber = typeof(queryString.phoneNumber) === "string" && queryString.phoneNumber.trim().length === 10 ? queryString.phoneNumber : false;
    if(!queryPhoneNumber){
        return callback(400, {error: 'required fields not present'})
    }

    //validate data
    const dataIsValid = validate(data);

    if(!dataIsValid){
        return callback(400, {error: 'missing required fields in payload data'})
    }

    //read data to see if it exists
    _data.read('users', queryPhoneNumber, (err) => {
        if(err){
            return callback(400, {error: 'user does not exist'})
        }

        const password = helpers.hash(data.payload.password);
        const {firstName, lastName, phoneNumber, tosAgreement} = data.payload;
        _data.update('users', queryPhoneNumber, {firstName, lastName, phoneNumber, password, tosAgreement}, (err, data) => {
            if(err){
               return callback(500, {error: "error occurred while updating record"})
            }

            data.password && delete data.password;

            callback(200, data);
        })
    })

}

//TODO: Auth
const _delete = (data, callback) => {
    const queryString = JSON.parse(data.queryString);
    const queryPhoneNumber = typeof(queryString.phoneNumber) === "string" && queryString.phoneNumber.trim().length === 10 ? queryString.phoneNumber : false;
    if(!queryPhoneNumber){
        return callback(400, {error: 'required fields not present'})
    }

    _data.read('users', queryPhoneNumber, (err) => {
        if(err){
            return callback(400, {error: 'record does not exist'});
        }

        _data.delete('users', queryPhoneNumber, (err) => {
            if(!err){
                callback(200, {success: 'record deleted successfully'})
            } else {
                callback(500, {error: 'error occurred attempting to delete record'})
            }
        })
    })
}

const _methodHandler = {
    post,
    get,
    put,
    delete: _delete
}

const users = (data, callback) => {
    //Determine method
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.includes(data.method.toLowerCase()) > -1) {
        return _methodHandler[data.method](data, callback);
    } else {
        callback(405);
    }
    callback(200, {});
}

module.exports = users;