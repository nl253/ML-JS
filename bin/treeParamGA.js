#!/usr/bin/node
const GA = require('../search/genetic');
const RT = require("../classification/randTree");
const DF = require("../DF");

const data = DF.loadDataSet('heart', true);
const xs = data.sliceCols(0, data.nCols - 1);
const ys = data.col(data.nCols - 1);

const data2 = DF.loadDataSet('diabetes', true);
const xs2 = data2.sliceCols(0, data2.nCols - 1);
const ys2 = data2.col(data2.nCols - 1);

const data3 = DF.loadDataSet('iris', false);
const xs3 = data3.sliceCols(0, data3.nCols - 1);
const ys3 = data3.col(data3.nCols - 1);


function decode(n) {
  // 3 bits for the int part
  // 8 bits for the fractional part
  // for every one of three variables

  const purityInt = n & 0b111;
  n = n >> 3;
  const purityFloat = n & 0b11111111;
  n = n >> 8;
  const purityWeight = parseFloat(`${purityInt}.${purityFloat}`);

  const leafItemInt = n & 0b111;
  n = n >> 3;
  const leafItemFloat = n & 0b11111111;
  n = n >> 8;
  const leafItemWeight =  parseFloat(`${leafItemInt}.${leafItemFloat}`);

  const splitWeightInt = n & 0b111;
  n = n >> 3;
  const splitWeightFloat = n & 0b11111111;

  const splitWeight =  parseFloat(`${splitWeightInt}.${splitWeightFloat}`);
  return { purityWeight, leafItemWeight, splitWeight };
}

function fitness(n) {
  const { purityWeight, leafItemWeight, splitWeight } = decode(n);
  const model = new RT(xs, ys, 0.125, null, null, null, 30, purityWeight, leafItemWeight, splitWeight);
  model.fit();
  const model2 = new RT(xs2, ys2, 0.125, null, null, null, 30, purityWeight, leafItemWeight, splitWeight);
  model2.fit();
  const model3 = new RT(xs3, ys3, 0.125, null, null, null, 30, purityWeight, leafItemWeight, splitWeight);
  model3.fit();
  return model.score + model2.score + model3.score;
}

const ga = new GA(fitness, 8, 1000000, 600, 0.1, 2, 10, 0.1, 0.5, 0.1);

for (let n of ga.search()) {
  console.log(decode(n));
}
