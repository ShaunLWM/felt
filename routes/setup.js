const config = require("../config");
const fs = require("fs-extra");
const uid = require('rand-token').uid;
const express = require("express");
let router = express.Router();

router.get("/", (req, res) => {
    if (config.setup) {
        return res.redirect("/");
    }

    let defaultConfig = Object.assign(config, {
        host: `${req.protocol}://${req.hostname}`,
    });

    defaultConfig["passwordProtected"]["salt"] = uid(50);
    return res.render("setup", {
        config: defaultConfig
    });
});

router.post("/", (req, res) => {
    let { host, title, adminUsername, adminPassword, protectEnabled, protectPassword, protectSalt = uid(50), protectDays = 7 } = req.body;
    if (host.length < 1) {
        host = `${req.protocol}://${req.hostname}`;
    }

    if (title.length < 1) {
        return res.status(400).json({ message: "Default title cannot be empty" });
    }

    if (adminUsername.length < 1) {
        return res.status(400).json({ message: "Admin username cannot be empty" });
    }

    if (adminPassword.length < 1) {
        return res.status(400).json({ message: "Admin username cannot be empty" });
    }

    protectEnabled = (protectEnabled === "true" ? 1 : 0);
    if (protectEnabled) {
        if (protectPassword.length < 1) {
            return res.status(400).json({ message: "Password protect is enabled. Please enter a password." });
        }

        if (protectSalt.length < 1) {
            protectSalt = uid(50);
        }

        if (protectDays.length < 1 || isNaN(protectDays)) {
            protectDays = 7;
        }

        try {
            protectDays = parseInt(protectDays);
        } catch (error) {
            protectDays = 7;
        }
    }

    let setupConfig = Object.assign(config, {
        setup: true,
        title,
        host,
        admin: {
            username: adminUsername,
            password: adminPassword
        },
        passwordProtected: {
            enabled: Boolean(protectEnabled),
            password: protectPassword,
            salt: protectSalt,
            maxDays: protectDays
        }
    });

    fs.writeFileSync("./config.js", `module.exports = ${JSON.stringify(setupConfig, null, 2)};`);
    console.log("[*] Setup complete! Please restart for configuration to take effect..");
    return res.status(200).json({ success: true });
});

module.exports = router;