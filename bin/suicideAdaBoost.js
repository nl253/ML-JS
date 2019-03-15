#!/usr/bin/node
const log = require('../utils/log');
const {readFile} = require('fs');
const parse = require('csv-parse');
const Ada = require("../classification/adaBoost");
const {transpose: t} = require("../utils");

readFile('./datasets/suicide/suicide.csv', (err, txt) => {
  parse(txt, (err, data) => {
    const _data = t(data.slice(0, 1000));
    const xs = t(_data.slice(0, _data.length - 1)).map(col => col.map(parseFloat));
    const ys = _data[_data.length - 1];
    const model = new Ada(xs, ys, 0.1, 'trees', 5);
    model.fit();
    log.info(model);
    log.info(model.score());
  });
});
