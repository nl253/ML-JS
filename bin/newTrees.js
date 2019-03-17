#!/usr/bin/node
const log = require("../utils/log");
const DF = require("../DF");
const RT = require("../classification/randTree");
const data = DF.loadDataSet('heart', true);
const xs = data.sliceCols(0, data.nCols - 1);
const ys = data[data.nCols - 1];
const model = new RT(xs, ys);
model.fit();
module.exports = {xs, ys, data, model, RT, DF, log};
