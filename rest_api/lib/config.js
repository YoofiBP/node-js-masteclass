//Create and export config variables

//container for all environments
const environments = {}
const hashingSecret = 'hashingSecret'

//staging (default)
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    hashingSecret
}


//production (default)
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    hashingSecret
}

//Determine which environment was passed as command line
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Determine if currentEnvironment is valid in environments object
const appEnvironment = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = {
    appEnvironment
}