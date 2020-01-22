const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

const ALL_ROLES = config.roles;
const MESSAGES = config.messages;
const ROLL_MESSAGE = "\nRolls done Today: "
var rollCount = {};
var resetDate = new Date();

function isBetween(n, from, to){
    return n>=from && n<=to;
}
function addRoll(userid){
        let currentRolls =  rollCount[""+userid]
        if(currentRolls&&currentRolls.amount < config.dailyRolls){
            currentRolls.amount++;
        }
        else if(!currentRolls){
            rollCount[""+userid] = {amount: 1}
        }
        else{
            return false
        }
    return true;
}

client.on("ready", () => {
  resetDate = new Date();
  resetDate.setHours(config.resetHour, 00, 00, 00);
  console.log("I am ready!");
});
 
client.on("message", (message) => {
  if (message.channel.name === config.channel && message.content.startsWith(".roll")) {
    //Reset the roll table if daily reset
    if(new Date()>resetDate){
        rollCount = {};
        resetDate = resetDate.setDate(resetDate.getDate()+1);
    }
    let toBeAssignedRole;
    let userid = message.member.id
    if(addRoll(userid)){
        rng = Math.round(Math.random()*1000)
        let toBeDeletedRole = message.member.roles.find(r => ALL_ROLES.includes(r.name));    
        if(rng===0){
            message.channel.send(MESSAGES[4] + ROLL_MESSAGE +  rollCount[""+userid].amount + " of "+ config.dailyRolls);
            toBeAssignedRole = message.guild.roles.find(r => r.name === ALL_ROLES[4])    
        }
        else if(isBetween(rng, 1,400)){
            message.channel.send(MESSAGES[0] + ROLL_MESSAGE +  rollCount[""+userid].amount + " of "+ config.dailyRolls)
            toBeAssignedRole = message.guild.roles.find(r => r.name === ALL_ROLES[0])    
        }
        else if(isBetween(rng, 401, 700)){
            message.channel.send(MESSAGES[1] + ROLL_MESSAGE +  rollCount[""+userid].amount + " of "+ config.dailyRolls)
            toBeAssignedRole = message.guild.roles.find(r => r.name === ALL_ROLES[1])    
        }
        else if(isBetween(rng, 701, 900)){
            message.channel.send(MESSAGES[2] + ROLL_MESSAGE +  rollCount[""+userid].amount + " of "+ config.dailyRolls)
            toBeAssignedRole = message.guild.roles.find(r => r.name === ALL_ROLES[2])    
        }
        else if(isBetween(rng, 901, 1000)){
            message.channel.send(MESSAGES[3] + ROLL_MESSAGE +  rollCount[""+userid].amount + " of "+ config.dailyRolls)
            toBeAssignedRole = message.guild.roles.find(r => r.name === ALL_ROLES[3])    
        }
        if (toBeDeletedRole&&!(toBeAssignedRole.id === toBeDeletedRole.id)){ 
            message.member.removeRole(toBeDeletedRole).catch();
        }
        message.member.addRole(toBeAssignedRole).catch();
    }
    else{
        message.channel.send("Daily Roll limit has been surpassed please try again later.")
    }
}
});
client.login("NjY5NTEzODUxNTU2OTg2ODkw.XihBJw.52KGPyLsW4w1ahql3urivrDe5HA")