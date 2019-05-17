const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const escape = require("escape-html");
const timeago = require("timeago.js");
const fs = require("fs-extra");

const PluginManager = require("./modules/PluginManager");
const Utils = require("./modules/Utils");
const config = require("./config");

const Database = require("./modules/Database");
let app = express();
fs.ensureDirSync("./public/img/");
Utils.getTemporaryDirectory();

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
app.use(bodyParser.urlencoded({ extended: true }))
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

    if (req.originalUrl.startsWith("/protected") || req.originalUrl.includes("/admin") || req.originalUrl === "/setup") { // ignore /protected route only
        return next();
    }

    if (typeof config.passwordProtected !== "undefined" && config.passwordProtected.enabled) {
        if (!Utils.validatePasswordCookies(req.cookies["protected"])) {
            return res.redirect(`/protected?redir=${req.originalUrl}`);
        }
    }

    return next();
});

app.use("/tools", require("./routes/tools"));
app.use("/protected", require("./routes/protected"));
app.use("/setup", require("./routes/setup"));
app.use("/admin", require("./routes/admin"));
app.use("/p", require("./routes/post"));
app.use("/t", require("./routes/tags"));
app.use("/m", require("./routes/month"));

app.get("/", (req, res) => {
    let posts = Utils.getPaginatedItems(Database.getPosts(), 1).filter(p => p["status"] === 1).map(p => Utils.processPostView(p));
    return res.render("home", {
        posts,
        tags: req.app.locals.tags,
        title: res.locals.defaultTitle,
        defaultTitle: res.locals.defaultTitle,
        avatar: Database.getConfig("avatar"),
        aboutMe: Database.getConfig("aboutMe"),
        archives: req.app.locals.postsArchives
    });
});

app.get("/:short([A-Za-z0-9]{5})$", (req, res, next) => {
    let short = req.params["short"];
    if (typeof short === "undefined" || short.trim().length < 1) {
        return next();
    }

    let post = Database.getPost({ short });
    if (typeof post === "undefined") {
        return next();
    }

    return res.redirect(`/p/${post["slug"]}`);
});

app.get("/page/:pageNumber", (req, res) => {
    let pageNumber = req.params["pageNumber"];
    if (!/^\d+$/g.test(pageNumber)) {
        pageNumber = 1;
    }

    let page = parseInt(pageNumber);
    let posts = Utils.getPaginatedItems(Database.getPosts(), page).filter(p => p["status"] === 1).map(p => Utils.processPostView(p));
    return res.render("home", {
        posts,
        tags: req.app.locals.tags,
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

app.pluginManager = PluginManager;
PluginManager.on("ready", () => {
    console.log(`[@] PluginManager initialised`);
    app.listen(config.port, () => console.log(`[@] felt listening on port ${config.port}!`))
});