#!/usr/bin/node
const log = require('../utils/log');
const {inspect} = require("util");
const {readCSV} = require('../utils/data');
const DT = require("../classification/randTree");
const data = readCSV("./datasets/heart/heart.csv", true);
const {transpose: t} = require("../utils");

const _data = t(data);
const xs = t(_data.slice(0, _data.length - 1).map(col => col.map(parseFloat)));
const ys = _data[_data.length - 1];

model = new DT(xs, ys);
model.fit();

log.info(inspect(model.tree, {depth: null}));
log.info(inspect(model, {depth: 0}));
log.info(model.score());
log.info(model.rules);
log.info(model.rulesEng);
