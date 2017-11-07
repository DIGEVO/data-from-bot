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
            res.render('tokenForm', {
                title: process.env.TITLE,
                errors: [{ msg: 'Por favor, vuelva a intentarlo.' }]
            });
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

        //fix si creo una función para esta operación, ocurren problemas con res.end, res.writeHead, etc
        //processPromises(ids, cachedData.token, res, req);
        Promise.all(ids.map(id => getPromiseRequest(id, cachedData.token)))
            .then(values => {
                const csvArr = values.map(str => {
                    const intent = JSON.parse(str.replace(/\n/g, ' ').replace(/\x5C\x6E/g, '|'));
                    return processIntent(intent, cachedData.intentsArr.find(o => o.id === intent.id));
                });

                const filename = new Date().toISOString().replace(/[:.]/g, '-');

                res.writeHead(200, {
                    'Content-Type': 'application/force-download',
                    'Content-disposition': `attachment; filename=${filename}.csv`
                });

                const S = String.fromCharCode(process.env.SEPARATOR);
                const header = `INTENT ID${S}INTENT NAME${S}TYPE${S}TEXT${S}EVENTOS${S}ACCIONES${S}PARÁMETROS\n`;
                res.end(`${header}${csvArr.join('\n')}`);
            })
            .catch(error => processError(error, req, res));
    }
};

function processData(data, req, res) {
    const intentsArr = JSON.parse(data).map(o =>
        ({
            id: o.id,
            name: o.name,
            events: o.events.map(e => e.name).join(),
            parameters: o.parameters.map(p => `${p.name}-${p.dataType}`).join(),
            actions: o.actions.join()
        }));
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

function processIntent(intent, refIntent) {
    const S = String.fromCharCode(process.env.SEPARATOR);

    const userSaysCsv = intent.userSays
        .map(o => o.data.map(o1 => o1.text).join(''))
        .map(s => `${intent.id}${S}${intent.name}${S}User Says${S}${s}${S}${refIntent.events}${S}${refIntent.actions}${S}${refIntent.parameters}`)
        .join('\n');

    const responses = intent.responses
        .map(o => [].concat.apply([], o.messages.map(m => [].concat(m.speech))));

    const responsesCsv = [].concat
        .apply([], responses)
        .map(s => `${intent.id}${S}${intent.name}${S}Response${S}${s}${S}${refIntent.events}${S}${refIntent.actions}${S}${refIntent.parameters}`)
        .join('\n');

    return [userSaysCsv, responsesCsv].filter(s => s).join('\n');
}
