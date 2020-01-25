const Discord = require("discord.js");
const client = new Discord.Client();
var dbHandler = require("./db-handling.js");
const db = new dbHandler()
const config = require("./config.json");

const ALL_ROLES = config.roles;
const MESSAGES = config.messages;
const ROLL_MESSAGE = "\nRolls done Today: "
var resetDate = new Date();

client.on("ready", () => {
  resetDate = new Date();
  resetDate.setHours(config.resetHour, 00, 00, 00);
  console.log("I am ready!");
});
 
client.on("message", (message) => {
  if (message.channel.name === config.channel && message.content.startsWith(".roll")) {
    //Reset the roll table if daily reset

    if(new Date()>resetDate){
        db.resetRolls();
        resetDate = resetDate.setDate(resetDate.getDate()+1);
    }
    let toBeAssignedRole;
    let userId = message.member.id
    if(addRoll(userId)){
        rng = Math.round(Math.random()*1000)
        let toBeDeletedRole = message.member.roles.find(r => ALL_ROLES.includes(r.name));    
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
            message.member.removeRole(toBeDeletedRole).catch();
        }
        message.member.addRole(toBeAssignedRole);
    }
    else{
        message.channel.send("Your daily roll limit has been reached please try again later.")
    }
}
});
client.login("NjY5NTEzODUxNTU2OTg2ODkw.XihBJw.52KGPyLsW4w1ahql3urivrDe5HA")

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
    return message.guild.roles.find(r => r.name === ALL_ROLES[roleIndex])
}