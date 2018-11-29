const moment = require('moment');

module.exports = {
    processPost: function (p) {
        return {
            ...p,
            date: moment(p.date).format('MMMM Do YYYY, h:mm:ss a'),
            tags: p.tags.length < 1 ? 'none' : (p.tags.reduce((accu, curr, i, arr) => {
                accu += `<a href="/t/${curr}">${curr}</a>`;
                if (i < (arr.length - 1)) {
                    accu += ', '
                }

                return accu;
            }, ''))
        }
    }
}