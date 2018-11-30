const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const escape = require('escape-html');

const Utils = require('./modules/Utils');
const config = require('./config');
let Database = require('./modules/Database');

let app = express();

let hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        escape: function (v) { return escape(v) }
    }
});


app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.use(function (req, res, next) {
    let tags = Database.getAllTags();
    res.locals.tags = tags;
    res.locals.helpers = hbs.helpers;
    return next();
});

app.use('/admin', require('./routes/admin'));
app.use('/p', require('./routes/post'));
app.use('/t', require('./routes/tags'));

app.get('/', function (req, res) {
    let posts = Database.getPosts().map(p => Utils.processPost(p));
    let tags = res.locals.tags;
    return res.render('home', {
        posts,
        tags,
        helpers: res.locals.helpers
    });
});

app.use(function (req, res) {
    return res.status(404).render('404');
});

app.listen(config.port, () => console.log(`Blog listening on port ${config.port}!`))