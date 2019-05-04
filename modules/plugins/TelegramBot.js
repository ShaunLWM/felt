const Bot = require("node-telegram-bot-api");
const config = require("../../config");

class TelegramBot {
    constructor() {
        this.bot = null;
        if (config["plugins"]["telegram"]["token"].length > 0) {
            this.bot = new Bot(config["plugins"]["telegram"]["token"], { polling: true });
            this.bot.on("message", msg => {
                console.log(msg);
                // this.bot.sendMessage(config["plugins"]["telegram"]["adminId"], 'Received your message');
            });
        }
    }

    sendMessage({ userId = null, message }) {
        if (this.bot === null) { return; }
        if (userId === null) {
            userId = config["plugins"]["telegram"]["adminId"];
        }

        this.bot.sendMessage(userId, message);
    }

    detectActions(type, info) {
        switch (type) {
            case "wrongPassword":
                this.sendMessage({ message: `Someone entered the wrong password: ${info["body"]["password"]}` });
                break;
            case "correctPassword":
                this.sendMessage({ message: `Someone entered the correct password: ${info["body"]["password"]}` });
                break;
        }
    }

}

module.exports = {
    plugin: new TelegramBot(),
    name: "telegram",
    required: ["token", "adminId"]
};