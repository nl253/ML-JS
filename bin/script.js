#!/usr/bin/node
const readCSV = require('../utils/data').readCSV;
const DecisionTree = require("../classification/tree");
const data = readCSV("../datasets/iris/iris.csv");
const inspect = require("util").inspect;
const t = require("../utils").transpose;
const xs = t(t(data).slice(0, 4).map(col => col.map(parseFloat)));
const ys = t(data)[4];
model = new DecisionTree(xs, ys);
console.log(model.fit());
console.log(inspect(model.tree, {depth: null}));
console.log(model.score());
