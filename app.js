const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const moment = require('moment');
const cors = require('cors');
const helmet = require('helmet');

let Database = require('./modules/Database');
let app = express();

let port = 8081;

let hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        foo: function () { return 'FOO!'; },
        bar: function () { return 'BAR!'; }
    }
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

app.get('/', function (req, res) {
    let posts = Database.getPosts().map(p => {
        return {
            ...p,
            date: moment(p.date).format('MMMM Do YYYY, h:mm:ss a'),
            tags: p.tags.length < 1 ? 'none' : (p.tags.reduce((accu, curr, index, arr) => {
                accu += `<a href="/t/${curr}">${curr}</a>`;
                if (index < arr.length - 1) {
                    accu += ', '
                }

                return accu;
            }, ''))
        }
    });

    return res.render('home', {
        posts
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))