const {go} = require("./app");
const {baseLogger} = require("./log");

go().catch((e: any) => {
        baseLogger.fatal(`Dying from error: ${e}`);
    });

module.exports = {};