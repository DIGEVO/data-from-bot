'use strict';

require('dotenv').config();

const df = require('../libs/dialogflow');

exports.intentsListGET = (req, res, next) => {
    res.render('tokenForm', { title: process.env.TITLE, errors: [] });
};

exports.intentsListPOST = (req, res, next) => {
    req.checkBody('token', 'Se necesita el token de acceso').notEmpty();
    req.sanitize('token').escape();
    req.sanitize('token').trim();

    const errors = req.validationErrors();

    if (errors) {
        res.render('tokenForm', { title: process.env.TITLE, errors: errors });
        return;
    }

    df.processToken(req, res);
};

exports.intentsDetailsPOST = (req, res, next) => {
    df.processIds(req, res);
};

