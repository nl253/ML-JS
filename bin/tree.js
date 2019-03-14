#!/usr/bin/node
const log = require('../utils/log');
const {inspect} = require("util");
const {readCSV} = require('../utils/data');
const DT = require("../classification/randTree");
const {transpose: t, shuffle, categorize} = require("../utils");
const data = readCSV("./datasets/admissions/admissions.csv", true);
shuffle(data);
const _data = t(data);
const xs = t(_data.slice(0, _data.length - 1).map(col => col.map(parseFloat)));

const ys = categorize(_data[_data.length - 1].map(parseFloat));

// log.info(ys);

model = new DT(xs, ys);
model.fit();

log.info(inspect(model.tree, {depth: null}));
log.info(inspect(model, {depth: 0}));
log.info(model.rulesEng);
log.info(model.score());
