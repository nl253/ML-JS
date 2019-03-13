#!/usr/bin/node
const {inspect} = require("util");
const {readCSV} = require('../utils/data');
const DT = require("../classification/tree");
const data = readCSV("../datasets/heart/heart.csv", true);
const {transpose: t} = require("../utils");
const _data = t(data);
const xs = t(_data.slice(0, _data.length - 1).map(col => col.map(parseFloat)));
const ys = _data[_data.length - 1];
model = new DT(xs, ys, 0.125, 7, 0.749, _data.length, 100, 5, 3.5, 0.01, 1000);
model.fit();
console.log(inspect(model.tree, {depth: null}));
console.log(inspect(model, {depth: 0}));
console.log(model.score());
console.log(model.rules);
console.log(model.rulesEng);
