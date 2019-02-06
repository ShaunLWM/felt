const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const escape = require("escape-html");
const timeago = require("timeago.js");

const Utils = require("./modules/Utils");
const config = require("./config");

let Database = require("./modules/Database");
let app = express();

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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
    let tags = Database.getAllTags();
    res.locals.tags = tags;
    res.locals.title = config.title;
    return next();
});

app.use("/admin", require("./routes/admin"));
app.use("/p", require("./routes/post"));
app.use("/t", require("./routes/tags"));

app.get("/", (req, res) => {
    let posts = Utils.getPaginatedItems(Database.getPosts(), 1).map(p => Utils.processPostView(p));
    let tags = res.locals.tags;
    return res.render("home", {
        posts,
        tags,
        title: res.locals.title
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
        title: res.locals.title
    });
});

app.use((req, res) => {
    return res.status(404).render("404");
});

app.listen(config.port, () => console.log(`[@] felt listening on port ${config.port}!`))