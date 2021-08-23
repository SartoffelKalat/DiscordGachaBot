const IS_TEST = false;

const Discord = require("discord.js");
const client = new Discord.Client();
var gen = require('random-seed'); // create a generator
var dbHandler = require("./db-handling.js");
var fs = require('fs');
const db = new dbHandler()
const config = require("./config.json");
const tokens = require("./tokens.json");
const moment = require('moment');

const ALL_ROLES = IS_TEST ? config.rolesDev : config.rolesDepl;
const MESSAGES = config.messages;
const ROLL_MESSAGE = "\nRolls done Today: "
var resetDate;

client.on("ready", () => {
  resetDate = moment.utc();
  resetDate.hour(config.resetHour).minute(0).second(0).millisecond(0);
  console.log("ready:\n reset date = ", resetDate);
});
 
client.on("message", (message) => {
    // RESET
    if(moment().isAfter(resetDate)){
        db.resetRolls();   
        resetDate.add(1, 'd');
    }

    let userId = message.member.id
    let reversedRoles = ALL_ROLES
    let memberRole = message.member.roles.cache.find(r => reversedRoles.includes(r.id))
    if(config.channels.indexOf(message.channel.id)>-1) {
        // ROLL
        if (message.content.startsWith(".roll")) {
            let toBeAssignedRole;
            let parsedCmd = message.content.split(" ")
            let wishedRolls = 1
            if(parsedCmd.length>1) {
                wishedRolls = Math.round(Number(parsedCmd[1]))
            }
            let rollsToBeDone = getActualRolls(userId, wishedRolls);

            if(memberRole && memberRole.id == config.adminRole){
                message.channel.send("Why would you want to roll as an admin...")
            }
            else if(rollsToBeDone>0){
                let toBeDeletedRole = memberRole;
                let bestRoleIndex = 0;
                if(rollsToBeDone>1){
                    message.channel.send("Doing **" + rollsToBeDone + "** rolls now: ")
                }
                let messages = ""
                for(let i=0; i<rollsToBeDone; i++) {
                    roleIndex = rollRole();
                    bestRoleIndex = Math.max(bestRoleIndex, roleIndex);
                    db.incrementRoll(userId)
                    messages = messages.concat(printRole(roleIndex), "\n")
                    
                }
                toBeAssignedRole = findRole(message, bestRoleIndex)
                message.channel.send(messages);
                message.channel.send(ROLL_MESSAGE + db.getRoll(userId).count + " of "+ config.dailyRolls)
                if(toBeAssignedRole) {
                    if(rollsToBeDone>1){
                        message.channel.send("---------------------------------------\n" + "after " + rollsToBeDone + " rolls you have been assigned the role: **" + toBeAssignedRole.name + "**")
                    }
                    if (toBeDeletedRole&&!(toBeAssignedRole.id === toBeDeletedRole.id)){
                        console.log("to be deleted: ", toBeDeletedRole)
                        console.log("to be assigned", toBeAssignedRole.id)
                        message.member.roles.remove(toBeDeletedRole).catch();
                    }
                    message.member.roles.add(toBeAssignedRole);
                } else {
                    message.channel.send("**An error occured during role assignment.**")

                }
            
            }
            else{
                message.channel.send("Your daily roll limit has been reached please try again later.")
            }
        }
        if(message.content.startsWith(".listRates")) {
            printDropRates(message)
        }
        // ADMIN COMMANDS
        if(isAdmin(userId, memberRole)) {
            if(message.content.startsWith(".reset")) {
                db.resetRolls();   
                message.channel.send("Daily roll limits have been successfully reset.")
            }
            if(message.content.startsWith(".gachaHelp")) {
                text = "**Usage: **\n\n" +
                "__Everyone__\n" +
                "    `.roll (amount)`\n        Rolls for the specified amount (amount is set to one if none is specified).\n        Specified amount will be automatically reduced to maximum allowed rolls.\n                Eg. `.roll 10`\n" +
                "    `.listRates`\n        Show current roll rates.\n"+
                "__Admins__\n" + 
                "    `.reset`\n        Reset daily roll cap for everyone.\n" +
                "    `.setRates role1 (role2) (role3) ... (roleN)`\n"+
                        "        Set the chance for the individual rolls to appear. \n        The individual droprates have to defined in ascending order in a space separated syntax. \n        The defined droprates have to be of type integer and have to sum up to 1000 (100%).\n"+
                        "                Eg. `.setRates 200 200 200 200 200` (20% chance for each role to appear)\n" +
                "    `.setDailyCap amount`\n        Sets the daily roll cap to the specified amount.\n                Eg. `.setDailyCap 10`\n";
                message.channel.send(text)
            }
            if(message.content.startsWith(".setRates")) {
                let parsedString = message.content.split(" ")
                if(parsedString.length === ALL_ROLES.length + 1) {
                    parsedString = parsedString
                      .slice(1)
                      .map(x => Math.round(Math.abs(Number(x))))
                    let sum = parsedString.reduce((a, b) => a + b, 0);
                    if(sum === 1000){
                        config.dropRates = parsedString
                        updateConfigFile()
                    } else {
                        message.channel.send("**Error: Please make sure all specified rates sum up to 1000 (specified sum = " + sum + ")**")

                    }
                } else {
                    message.channel.send("**Error: Please make sure you have defined droprates for all roles ("+ ALL_ROLES.length +")**")
                }
                printDropRates(message)
            }
            if(message.content.startsWith(".setDailyCap")) {
                amount = Number(message.content.split(" ")[1])
                if(amount>0) {
                    amount = Math.round(amount);
                    config.dailyRolls = amount;
                    updateConfigFile()
                    message.channel.send("Daily roll amount successfully set to " +  amount + ".")
                } else {
                    message.channel.send("**Error: Please make sure the roll amount is a number > 0**")
                }
            }
        }
}
});
if(IS_TEST){
    client.login(tokens.dev)
} else {
    client.login(tokens.depl)
}

function isBetween(n, from, to){
    return n>=from && n<=to;
}
function getActualRolls(userId, wishedAmount){
        let roll = db.getRoll(userId);
        if(!roll){
            db.setRoll(userId, 0);
            roll = db.getRoll(userId);
        }
        if(roll&&roll.count == config.dailyRolls) {
            return 0
        }
        else {
            let diff = config.dailyRolls - (roll.count + wishedAmount)
            // calculate how many rolls can actually be done
            diff = Math.abs(diff < 0 ? diff: 0)
            let actualAmount = wishedAmount-diff
            return actualAmount
        }
        
}

function printDropRates(message) {
    let msg = "**Drop Rates**\n"
    let dropRates = config.dropRates;
    for(i=0;i<dropRates.length;i++) {
        let dropRate = dropRates[i];
        let role = findRole(message, i)
        msg = msg.concat(role.name, ": ", dropRates[i], " ("+dropRates[i]/10.0+"%)\n")
    }
    message.channel.send(msg)
}

function rollRole(){
    let rng = Math.floor(Math.random()*1000)
    let count = 0
    let dropRates = config.dropRates
    for(let i=0;i<dropRates.length;i++) {
        let dropRate = dropRates[i];
        if(isBetween(rng, count, count+dropRate)) {
            return i;
        }
        count +=dropRates[i];
    }

}

function printRole( roleIndex){
    return MESSAGES[roleIndex] + "\n";
}
function findRole(message, roleIndex){
    return message.guild.roles.cache.find(r => r.id === ALL_ROLES[roleIndex])
}
function isAdmin(userId, memberRole) {
    return (userId == "169153031097679872" || (memberRole && memberRole.id == config.adminRole))
}
function updateConfigFile() {
    fs.writeFileSync('config.json', JSON.stringify(config,  null, 2));
}