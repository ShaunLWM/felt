const moment = require('moment');
const escape = require('escape-html');
const Database = require('./Database');

module.exports = {
    processNewPost: function (body) {
        let tags = body.tags || '';
        if (tags.length > 0 && tags.includes(',')) {
            tags = tags.split(',').filter(w => {
                return w.length > 0;
            });
        } else {
            if (tags.trim().length > 0) {
                tags = [tags.trim()];
            }
        }
    
        let date = Math.round((new Date()).getTime());
        let title = body.title.trim();
        let slug = slugify(title).trim();
        let body = body.body.trim().replace(/class="fr-fic fr-dib"/g, 'class="fr-fic fr-dib materialboxed"');
        let post = {
            slug,
            title,
            date,
            body,
            tags
        };
    
        Database.addPost(post);
        return post;
    },
    processPostView: function (p) {
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