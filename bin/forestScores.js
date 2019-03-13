#!/usr/bin/node
const {readCSV} = require('../utils/data');
const NB = require("../classification/naive_bayes");
const data = readCSV("./scores.csv", true);
const {transpose: t} = require("../utils");
const _data = t(data);
const xs = t(_data.slice(0, _data.length - 1).map(col => col.map(parseFloat)));
const ys = _data[_data.length - 1];
model = new NB(xs, ys);
model.fit();
console.log(model);
console.log(model.score());
