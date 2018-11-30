const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const moment = require('moment');
const cors = require('cors');
const helmet = require('helmet');

const Utils = require('./modules/Utils');
const config = require('./config');
let Database = require('./modules/Database');

let app = express();

let hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs'
});


app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.use('/admin', require('./routes/admin'));
app.use('/p', require('./routes/post'));
app.use('/t', require('./routes/tags'));

app.get('/', function (req, res) {
    let posts = Database.getPosts().map(p => Utils.processPost(p));
    return res.render('home', {
        posts
    });
});

app.use(function (req, res, next) {
    return res.status(404).render('404');
});

app.listen(config.port, () => console.log(`Blog listening on port ${config.port}!`))