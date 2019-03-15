#!/usr/bin/node
const {inspect} = require("util");
const {readFile} = require('fs');
const DT = require("../classification/randTree");
const parse = require('csv-parse');
const {transpose: t} = require("../utils");
const log = require('../utils/log');

readFile('./datasets/suicide/suicide.csv', (err, txt) => {
  parse(txt, (err, data) => {
    log.info(data);
    const _data = t(data.slice(0, 1000));
    const xs = t(_data.slice(0, _data.length - 1));
    const ys = _data[_data.length - 1];
    const model = new DT(xs, ys, 0.1, 10, 0.799, null, 100, 30, 3.5, 0.7, 100);
    log.info(model.uniqueLabels);
    model.fit();
    log.info(inspect(model.tree, {depth: null}));
    log.info(inspect(model, {depth: 0}));
    log.info(model.score());
  });
});

