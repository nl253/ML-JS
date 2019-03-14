#!/usr/bin/node
const log = require('../utils/log');
const {readCSV} = require('../utils/data');
const Ada = require("../classification/adaBoost");
const data = readCSV("./datasets/iris/iris.csv", false);
const {transpose: t} = require("../utils");
const _data = t(data);
const xs = t(_data.slice(0, _data.length - 1).map(col => col.map(parseFloat)));
const ys = _data[_data.length - 1];
model = new Ada(xs, ys, 0.1);
model.fit();
log.info(model);
log.info(model.score());
