'use strict';

const rp = require('request-promise-native');
const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ stdTTL: process.env.TTL });

const self = module.exports = {

    processToken(req, res) {
        rp.get(process.env.URL, { 'auth': { 'bearer': req.body.token } })
            .then(data => processData(data, req, res))
            .catch(error => processError(error, req, res));
    },

    processIds(req, res) {
        const ids = [].concat(req.body.id || []);
        const cachedData = cache.get(req.body.sessionid);

        if (!cachedData.intentsArr) {
            res.render('tokenForm', { title: process.env.TITLE, errors: [{ msg: 'Por favor, vuelva a intentarlo.' }] });
            return;
        }

        if (ids.length == 0) {
            res.render('intentsListForm', {
                title: process.env.TITLE,
                intentsArr: cachedData.intentsArr,
                sessionid: req.body.sessionid,
                errors: [{ msg: 'Debe seleccionar al menos una intención.' }]
            });
            return;
        }

        Promise.all(ids.map(id => getPromiseRequest(id, cachedData.token)))
            .then(values => {
                const ids = values.map(str => JSON.parse(str).id);

                const str = ids.join(' | ');
                res.send(`NOT IMPLEMENTED: Intents Details ${str ? str : 'empty'}`);
            })
            .catch(error => processError(error, req, res));

    }
};

function processData(data, req, res) {
    const intentsArr = JSON.parse(data).map(o => ({ id: o.id, name: o.name }));
    cache.set(req.id, { token: req.body.token, intentsArr: intentsArr });

    res.render('intentsListForm', {
        title: process.env.TITLE,
        intentsArr: intentsArr,
        sessionid: req.id,
        errors: []
    });
}

function processError(error, req, res) {
    const err = JSON.parse(error.error);
    error.status = err.status.code;
    res.render('error', { message: err.status.errorDetails, error: error });
}

function getPromiseRequest(id, token) {
    return rp.get(
        process.env.URL_ID.replace(':id', id),
        { 'auth': { 'bearer': token } });
}
