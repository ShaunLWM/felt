const EventEmitter = require("events");
const fg = require("fast-glob");
const path = require("path");
const config = require("../config");
const Utils = require("./Utils");

class PluginManager extends EventEmitter {
    constructor() {
        super();
        this.plugins = [];
        this.pluginFiles = fg([path.join(__dirname, "plugins", "*.js")]).then(files => {
            files.forEach(file => {
                let plugin = require(file);
                if (typeof plugin["name"] === "undefined") return delete require.cache[require.resolve(file)];

                let pluginName = plugin["name"];
                console.log(`[@] plugin found: ${pluginName}`);
                if (typeof config["plugins"][pluginName] !== "undefined" && typeof config["plugins"][pluginName]["enabled"] !== "undefined" && config["plugins"][pluginName]["enabled"] && this.assertPluginConfig({ pluginName, requiredConfigs: plugin["required"] })) {
                    console.log(`[@] plugin ${pluginName} enabled`);
                    this.plugins.push({
                        name: pluginName,
                        plugin: plugin["plugin"]
                    });
                } else {
                    console.log(`[!] plugin [${pluginName}] disabled`);
                }
            });

            console.log(`[@] ${this.plugins.length} plugins running`);
            this.emit("ready");
        }).catch(error => {
            return console.log(`[!] failed to load PluginManager ${error}`);
        });
    }

    detectActions(type, req) {
        if (this.plugins.length < 1) return;
        let info = Utils.parseRequest(req);
        config["actions"][type].forEach(p => {
            console.log(`[@] running action for type: ${type} & plugin: ${p}`);
            let plugin = this.plugins.find(function (element) {
                return element["name"] === p;
            });

            if (typeof plugin !== "undefined") {
                plugin["plugin"].detectActions(type, info);
            }
        });
    }

    assertPluginConfig({ pluginName, requiredConfigs }) {
        if (typeof config["plugins"][pluginName] === "undefined") {
            return false;
        }

        let pluginConfig = config["plugins"][pluginName];
        let canContinue = true;
        for (const configVar of requiredConfigs) {
            if (typeof pluginConfig[configVar] === "undefined" || pluginConfig[configVar].length < 1) {
                console.log(`[!] plugin [${pluginName}] missing config: ${configVar}`);
                canContinue = false;
            }
        }

        return canContinue;
    }
}

module.exports = new PluginManager();