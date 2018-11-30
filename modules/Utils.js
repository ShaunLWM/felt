const moment = require('moment');
const escape = require('escape-html');

module.exports = {
    processPost: function (p) {
        return {
            ...p,
            date: moment(p.date).format('MMMM Do YYYY, h:mm a'),
            tags: p.tags.length < 1 ? 'none' : (p.tags.reduce((accu, curr, i, arr) => {
                accu += `<a href="/t/${curr}">${escape(curr)}</a>`;
                if (i < (arr.length - 1)) {
                    accu += ', '
                }

                return accu;
            }, ''))
        }
    }
}