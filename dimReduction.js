const {transpose: t} = require('./utils');
const {variance} = require('./utils');

function varRemove(xs_, minVar = 1) {
  const xs = [].concat(xs_);
  const variances = Array(xs[0].length).fill(0).map((_, colIdx) => variance(xs.map(x => x[colIdx])));
  for (let col = 0; col < xs[0].length; col++) {
    if (variances[col] < minVar) {
      for (let row = 0; row < xs.length; row++) {
        xs[row] = xs[row].slice(0, col).concat(xs[row].slice(col + 1));
      }
    }
  }
  return xs;
}

function nthBestVar(data, nBest = null) {
  const columns = t(data);
  if (nBest === null) nBest = Math.floor(columns.length * 0.3);
  const index = {};

  for (let colIdx = 0; colIdx < data[0].length; colIdx++) {
    index[colIdx] = variance(columns[colIdx]);
  }

  const ordered = Object.entries(index).sort((pair1, pair2) => {
    if (pair1[1] < pair2[1]) return -1;
    else if (pair1[1] > pair2[1]) return -1;
    else return 0;
  }).slice(0, nBest).map(pair => parseInt(pair[0]));

  const dataCpy = [].concat(data);

  for (let colIdx = 0; colIdx < dataCpy[0].length; colIdx++) {
    if (ordered.indexOf(colIdx) < 0) {
      for (let row = 0; row < dataCpy.length; row++) {
        dataCpy[row] = dataCpy[row].slice(0, colIdx).concat(dataCpy[row].slice(colIdx + 1));
      }
    }
  }

  return dataCpy;
}

module.exports = {varRemove, nthBestVar};
