module.exports = (_methodHandler) => (data, callback) => {
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.includes(data.method.toLowerCase()) > -1) {
        return _methodHandler[data.method](data, callback);
    } else {
        callback(405);
    }
    callback(200, {});
}