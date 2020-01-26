const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

module.exports = class DbHandler {
    constructor(){
        db.defaults( {rolls: []})
            .write();
    }
    getRoll = function(userId){
        return db.get('rolls')
                .find({ id: userId })
                .value();
    }
    setRoll = function(userId, amount){
        db.get('rolls')
            .push({ id: userId, count: amount})
            .write();
    }
    incrementRoll = function(userId){
        db.get('rolls')
            .find({ id: userId })
            .update('count', n => n + 1)
            .write();
    }
    resetRolls = function(){
        db.set("rolls", [])
            .write();
    }
}

