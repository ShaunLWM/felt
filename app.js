const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const helmet = require("helmet");
const escape = require("escape-html");
const timeago = require("timeago.js");
const fs = require("fs-extra");
const uid = require('rand-token').uid;

const Utils = require("./modules/Utils");
const config = require("./config");

let Database = require("./modules/Database");
let app = express();
fs.ensureDirSync("./public/img/");

let hbs = exphbs.create({
    defaultLayout: "main",
    extname: ".hbs",
    helpers: {
        escape: function (v) { return escape(v) },
        removeTruncate: function (v) {
            return v.replace(/<(.|\n)*?>/g, "").substring(0, 100) + " ...";
        },
        formatTimeAgo: function (v) {
            return timeago().format(v);
        }
    }
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.use(express.static("public"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
    res.locals.defaultTitle = config.title;
    if (typeof app.locals.tags === "undefined") {
        console.log("[@] forcing tags refresh");
        app.locals.tags = Database.getAllTags();
    }

    if (typeof app.locals.postsArchives === "undefined") {
        console.log("[@] forcing posts archives refresh");
        app.locals.postsArchives = Database.parseHomepageArchives();
    }

    return next();
});

app.use((req, res, next) => {
    if (!config.setup && req.originalUrl !== "/setup") {
        return res.redirect("/setup");
    }

    if (req.originalUrl === "/protected" || req.originalUrl.includes("/admin") || req.originalUrl === "/setup") { // ignore /protected route only
        return next();
    }

    if (typeof config.passwordProtected !== "undefined" && config.passwordProtected.enabled) {
        if (!Utils.validatePasswordCookies(req.cookies["protected"])) {
            return res.redirect("/protected");
        }
    }

    return next();
});

app.use("/admin", require("./routes/admin"));
app.use("/p", require("./routes/post"));
app.use("/t", require("./routes/tags"));
app.use("/m", require("./routes/month"));
app.use("/protected", require("./routes/protected"));

app.get("/setup", (req, res) => {
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

app.post("/setup", (req, res) => {
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
            enabled: new Boolean(protectEnabled),
            password: protectPassword,
            salt: protectSalt,
            maxDays: protectDays
        }
    });

    fs.writeFileSync("./config.js", `module.exports = ${JSON.stringify(setupConfig, null, 2)};`);
    console.log("[*] Setup complete! Please restart for configuration to take effect..");
    return res.status(200).json({ success: true });
});

app.get("/", (req, res) => {
    let posts = Utils.getPaginatedItems(Database.getPosts(), 1).map(p => Utils.processPostView(p));
    let tags = res.locals.tags;
    return res.render("home", {
        posts,
        tags,
        title: res.locals.defaultTitle,
        defaultTitle: res.locals.defaultTitle,
        avatar: Database.getConfig("avatar"),
        aboutMe: Database.getConfig("aboutMe"),
        archives: req.app.locals.postsArchives
    });
});

app.get("/page/:pageNumber", (req, res) => {
    let pageNumber = req.params["pageNumber"];
    if (!/^\d+$/g.test(pageNumber)) {
        pageNumber = 1;
    }

    let page = parseInt(pageNumber);
    let posts = Utils.getPaginatedItems(Database.getPosts(), page).map(p => Utils.processPostView(p));
    let tags = res.locals.tags;
    return res.render("home", {
        posts,
        tags,
        title: res.locals.defaultTitle,
        defaultTitle: res.locals.defaultTitle,
        avatar: Database.getConfig("avatar"),
        aboutMe: Database.getConfig("aboutMe"),
        archives: req.app.locals.postsArchives
    });
});

app.use((req, res) => {
    return res.status(404).render("404");
});

app.listen(config.port, () => console.log(`[@] felt listening on port ${config.port}!`))