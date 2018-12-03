const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json');
const lodashId = require('lodash-id');

class Database {
    constructor() {
        this.db = low(adapter);
        this.db._.mixin(lodashId);
        this.db.defaults({ posts: [], tags: [], analytics: [], drafts: [] }).write();
    }

    addPost({ slug, title, date, body, tags }) {
        this.db.get('posts').push({
            slug, title, date, body, tags
        }).write();

        this.processTags(tags);
        this.processAnalytics(slug);
    }

    getAllTags() {
        return this.db.get('tags').orderBy('u', ['desc']).value();
    }

    getPosts(count = 5) {
        return this.db.get('posts').orderBy('date', ['desc']).take(count).value();
    }

    deletePost(id) {
        return this.db.get('posts').remove({ id }).write();
    }

    processAnalytics(slug) {
        let analytics = this.db.get('analytics').find({ slug }).value();
        if (typeof analytics === 'undefined') {
            return this.db.get('analytics').push({
                slug,
                views: 0,
                stats: []
            }).write();
        }

        return this.db.get('analytics').find({ slug }).assign({ views: analytics.views + 1 }).write();
    }

    processTags(tags) {
        let old = this.db.get('tags').value();
        tags.forEach(t => {
            let i = this.db._.find(old, function (o) { return o.v === t; });
            if (typeof i === 'undefined') {
                return this.db.get('tags').push({
                    v: t.trim(),                    // value
                    c: 1,                           // count
                    u: ((new Date()).getTime())     // last updated
                }).write();
            }

            return this.db.get('tags').find({ v: t }).assign({ c: i.c + 1, u: ((new Date()).getTime()) }).write();
        });
    }

    findPost({ tag = null, date = null, slug = null }) {
        let posts = this.db.get('posts').value();
        if (tag !== null) {
            return posts.filter(p => {
                return p.tags.includes(tag);
            });
        }

        if (slug !== null) {
            this.processAnalytics(slug);
            return this.db.get('posts').find({ slug }).value();
        }
    }

    getDrafts() {
        return this.db.get('drafts').orderBy('date', ['desc']).value();
    }

    saveDraft({ id, title, body, tags, scheduled = 0 }) {
        let date = new Date().getTime();
        let post = this.db.get('drafts').find({ id }).value();
        if (typeof post === 'undefined') {
            return this.db.get('drafts').push({
                title, body, tags, date, scheduled
            }).write();
        }

        return this.db.get('drafts').find({ id }).assign({ date, title, body, tags, scheduled }).write();
    }

    deleteDraft(id) {
        return this.db.get('drafts').remove({ id }).write();
    }

    publicDraft(id) {
        let post = this.db.get('drafts').find({ id }).value();
        this.addPost(post);
        return this.db.get('drafts').remove({ id }).write();
    }
}

module.exports = new Database();