#!/usr/bin/node
const GA = require('../search/genetic');
const RT = require("../classification/randTree");
const DF = require("../DF");

const data = DF.loadDataSet('heart', true);
const xs = data.sliceCols(0, data.noCols - 1);
const ys = data.col(data.noCols - 1);

const data2 = DF.loadDataSet('diabetes', true);
const xs2 = data2.sliceCols(0, data2.noCols - 1);
const ys2 = data2.col(data2.noCols - 1);

const data3 = DF.loadDataSet('iris', false);
const xs3 = data3.sliceCols(0, data3.noCols - 1);
const ys3 = data3.col(data3.noCols - 1);


function decode(n) {
  // 3 bits for the int part
  // 8 bits for the fractional part
  // vars = minLeafItems, minPurity, maxDepth, maxCheckVals
  const minPurity = parseFloat(`0.${n & 0b1111111}`); // 7 bits
  n = n >> 7;
  const minLeafItems = parseInt(n & 0b11111); // 5 bits
  n = n >> 5;
  const maxDepth = parseInt(n & 0b111111); // 6 bits
  n = n >> 6;
  const maxCheckVals = parseInt(n & 0b11111111); // 8 bits
  return { minLeafItems, minPurity, maxDepth, maxCheckVals };
}

function fitness(n) {
  const {maxCheckVals, minPurity, maxDepth, minLeafItems} = decode(n);
  const model = new RT(xs, ys, 0.125, minLeafItems, minPurity, maxDepth, maxCheckVals);
  model.fit();
  const model2 = new RT(xs2, ys2, 0.125, minLeafItems, minPurity, maxDepth, maxCheckVals);
  model2.fit();
  const model3 = new RT(xs3, ys3, 0.125, minLeafItems, minPurity, maxDepth, maxCheckVals);
  model3.fit();
  return model.score() + model2.score() + model3.score();
}

const ga = new GA(fitness, 8, 1000000, 600, 0.1, 2, 10, 0.1, 0.5, 0.1);

for (let n of ga.search()) {
  console.log(decode(n));
}
