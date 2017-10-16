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
        const intentsArr = cache.get(req.body.sessionid);

        if (!intentsArr) {
            res.render('tokenForm', { title: process.env.TITLE, errors: [{ msg: 'Por favor, vuelva a intentarlo.' }] });
            return;
        }

        if (ids.length == 0) {
            res.render('intentsListForm', {
                title: process.env.TITLE,
                intentsArr: intentsArr,
                sessionid: req.body.sessionid,
                errors: [{ msg: 'Debe seleccionar al menos una intención.' }]
            });
            return;
        }

        
        const str = ids.join(' | ');
        res.send(`NOT IMPLEMENTED: Intents Details "${req.body.sessionid}" ${str ? str : 'empty'}`);
    }
};

function processData(data, req, res) {
    const intentsArr = JSON.parse(data).map(o => ({ id: o.id, name: o.name }));
    cache.set(req.id, intentsArr);

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
