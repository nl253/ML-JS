const {variance} = require('./utils/stats');

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

module.exports = {varRemove};
