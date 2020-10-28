const Discord = require("discord.js");
const client = new Discord.Client();
var dbHandler = require("./db-handling.js");
const db = new dbHandler()
const config = require("./config.json");
const moment = require('moment');

const ALL_ROLES = config.roles;
const MESSAGES = config.messages;
const ROLL_MESSAGE = "\nRolls done Today: "
var resetDate;

client.on("ready", () => {
  resetDate = moment();
  resetDate.hour(config.resetHour).minute(27).second(0).millisecond(0);
  console.log("I am ready!");
});
 
client.on("message", (message) => {
    if(moment().isAfter(resetDate)){
        db.resetRolls();   
        resetDate.add(1, 'd');
    }

    let userId = message.member.id
    if (message.channel.id === config.channel && message.content.startsWith(".roll")) {
        let toBeAssignedRole;
        
        if(addRoll(userId)){
            rng = Math.round(Math.random()*1000)
            let toBeDeletedRole = message.member.roles.cache.find(r => ALL_ROLES.includes(r.id));    
            if(rng===0){
                toBeAssignedRole = printAndAssignRole(message, 4, userId)
            }
            else if(isBetween(rng, 1,400)){
                toBeAssignedRole = printAndAssignRole(message, 0, userId)
            }
            else if(isBetween(rng, 401, 700)){
                toBeAssignedRole = printAndAssignRole(message, 1, userId)
            }
            else if(isBetween(rng, 701, 900)){
                toBeAssignedRole = printAndAssignRole(message, 2, userId)
            }
            else if(isBetween(rng, 901, 1000)){
                toBeAssignedRole = printAndAssignRole(message, 3, userId)
            }
            if (toBeDeletedRole&&!(toBeAssignedRole.id === toBeDeletedRole.id)){ 
                message.member.roles.remove(toBeDeletedRole).catch();
            }
            message.member.roles.add(toBeAssignedRole);
        }
        else{
            message.channel.send("Your daily roll limit has been reached please try again later.")
        }
    }
    else if(message.channel.name === config.channel && message.content.startsWith(".reset") && userId == "169153031097679872") {
        db.resetRolls();   
        message.channel.send("Daily rolls have been reset.")

    }
});
client.login("NjY5NTEzODUxNTU2OTg2ODkw.Xig7XQ._2Mu1Ynsd6JK6oBJHrqqDKa9if4")

function isBetween(n, from, to){
    return n>=from && n<=to;
}
function addRoll(userId){
        let roll = db.getRoll(userId);
        if(roll&&roll.count < config.dailyRolls){
            db.incrementRoll(userId);
        }
        else if(!roll){
            db.setRoll(userId, 1);
        }
        else{
            return false
        }
    return true;
}
function printAndAssignRole(message, roleIndex, userId){
    message.channel.send(MESSAGES[roleIndex] + ROLL_MESSAGE +  db.getRoll(userId).count + " of "+ config.dailyRolls);
    return message.guild.roles.cache.find(r => r.id === ALL_ROLES[roleIndex])
}