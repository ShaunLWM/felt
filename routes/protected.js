const express = require("express");
const Database = require("../modules/Database");
const Utils = require("../modules/Utils");

const config = require("../config");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(config.passwordProtected.salt);

let router = express.Router();

router.get("/", (req, res) => {
    if (typeof config.passwordProtected !== "undefined" && config.passwordProtected.enabled && !Utils.validatePasswordCookies(req.cookies["protected"])) {
        return res.render("protected", {
            title: "Password Protected",
            defaultTitle: res.locals.defaultTitle
        });
    }

    return res.redirect("/");
});

router.get("/delete", (req, res) => {
    res.clearCookie("protected");
    return res.redirect("/protected");
});

router.post("/", (req, res) => {
    if (typeof req.body["password"] === "undefined" || req.body["password"].length < 1) {
        return res.status(400).json({ message: "Missing password value" });
    }

    let password = req.body["password"];
    if (password !== config.passwordProtected.password) {
        return res.status(400).json({ message: "Wrong password" });
    }

    let currentTime = Math.round((new Date()).getTime() / 1000);
    let toEncrypt = `${currentTime}|${config.passwordProtected.password}`;
    res.cookie('protected', cryptr.encrypt(toEncrypt), { maxAge: (1000 * 60 * 60 * 24 * config.passwordProtected.maxDays), httpOnly: true });
    return res.status(200).json({ message: "Success" });
});

module.exports = router;