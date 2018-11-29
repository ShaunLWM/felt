const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json');
const lodashId = require('lodash-id');

class Database {
    constructor() {
        this.db = low(adapter);
        this.db._.mixin(lodashId);
        this.db.defaults({ posts: [], tags: [], analytics: [] }).write();
    }

    addPost({ slug, title, date, body, tags }) {
        this.db.get('posts').push({
            slug, title, date, body, tags
        }).write();
        this.processTags(tags);
        // !todo update analytics
    }

    getPosts() {
        return this.db.get('posts').orderBy('date', ['desc']).take(5).value()
    }

    processTags(tags) {
        let old = this.db.get('tags').value();
        tags.forEach(t => {
            let i = this.db._.find(old, function (o) { return o.v === t; });
            if (typeof i === 'undefined') {
                return this.db.get('tags').push({
                    v: t,
                    c: 1
                }).write();
            }

            return this.db.get('g').find({ v: t }).assign({ c: i.c++ }).write();
        })
    }

    findPost({ tag = null, date = null, slug = null }) {
        let posts = this.db.get('posts').value();
        if (tag !== null) {
            return posts.filter(p => {
                return p.tags.includes(tag);
            });
        }

        if (slug !== null) {
            return this.db.get('posts').find({ slug }).value();
        }
    }
}

module.exports = new Database();