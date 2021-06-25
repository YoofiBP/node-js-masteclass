/*
Library for storing data
 */
const fs = require('fs/promises');
const path = require('path');
const helpers = require('./helpers');

const create = async (directory, fileName, data, callback) => {
    //check if directory exists
    try {
        await fs.access(lib.baseDir + directory)
    } catch (e) {
       await fs.mkdir(lib.baseDir + directory);
    } finally {
        const destination = await fs.open(lib.baseDir + directory + '/' + fileName + '.json', 'wx');
        if (!destination) {
            return callback('Could not create new file, it may already exist');
        }
        const stringData = JSON.stringify(data);
        try {
            console.log('Success')
            await destination.writeFile(stringData);
        } catch (e) {
            return callback('Error Writing to new file')
        }

        try {
            await destination.close();
            callback(false);
        } catch (e) {
            callback('Error closing file');
        }
    }
}

const read = async (directory, fileName, callback) => {
    try {
        const data = await fs.readFile(lib.baseDir + directory + '/' + fileName + '.json', {encoding: 'utf8'});
        callback(false, helpers.parseJsonToObject(data));
    } catch (e) {
        callback('Error when reading file');
    }
}

const update = async (directory, fileName, data, callback) => {
    let destination;
    try {
        destination = await fs.open(lib.baseDir + directory + '/' + fileName + '.json', 'r+');
    } catch (e) {
        return callback('Could not open file for updating. File may not exist')
    }

    try {
        //truncate file
        await destination.truncate();
    } catch (e) {
        return callback('Error truncating file');
    }

        const stringData = JSON.stringify(data);

    try {
        await destination.writeFile(stringData);
        callback(false, data);
    } catch (e) {
        return callback('Error writing file');
    }

    try {
        await destination.close();
    } catch (e) {
        return callback('Error closing file')
    }
}

const _delete = async (directory, fileName, callback) => {
    try {
        await fs.unlink(lib.baseDir + directory + '/' + fileName + '.json');
        return callback(false);
    }catch (e) {
        callback('Unable to delete file');
    }
}

// Base directory of data folder
const baseDir = path.join(__dirname, '/../.data/')

//Container for module to be exported
const lib = {
    update,
    create,
    read,
    baseDir,
    delete: _delete
};

module.exports = lib;