const { bag } = require('.');

function mean(nums) {
  return nums.reduce((x1, x2) => x1 + x2) / nums.length;
}

/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @return {Number}
 */
/*
 * function covariance(xs, ys) {
 * const muXS = mean(xs);
 * const muYS = mean(ys);
 * const left = xs.map(x => x - muXS);
 * const right = ys.map(y => y - muYS);
 * return mean(left.map((l, idx) => l * right[idx]).reduce((a, b) => a + b));
 * }
 */

/**
 * @param {!Array<!Number>} nums non-empty array of nums
 * @returns {number}
 */
function variance(nums) {
  const mu = mean(nums);
  return nums.map(x => (x - mu) ** 2).reduce((x1, x2) => x1 + x2) / nums.length;
}

/**
 * @param {!Array<!Number>} nums non-empty array of nums
 * @returns {number}
 */
function stdev(nums) {
  return Math.sqrt(variance(nums));
}

/**
 * @param {!Array<Number>} xs
 * @returns {{min: number, max: number}}
 */
function range(xs) {
  return xs.reduce((x1, x2) => Math.max(x1, x2))
      - xs.reduce((x1, x2) => Math.min(x1, x2));
}

/**
 * @param {!Array<*>} xs
 * @returns {*} mode
 */
function mode(xs) {
  return Object
    .entries(bag(xs))
    .map(([s, count]) => [parseInt(s), count])
    .reduce(([val1, count1], [val2, count2]) => (count2 > count1
      ? [val2, count2]
      : [val1, count1]))[0];
}

/**
 * @param {!Array<!Number>} xs
 * @returns {!number} mean abs deviation
 */
function mad(xs) {
  const mu = mean(xs);
  return mean(xs.map(x => Math.abs(x - mu)));
}

/**
 * @param {!Array<!Number>} xs
 * @returns {!number} median
 */
function median(xs) {
  return nQuart(xs, 1, 2);
}

/**
 * @param {!Array<!Number>} xs
 * @param {!Number} [n]
 * @param {!Number} [m]
 * @returns {!number} nth quartile
 */
function nQuart(xs, n = 2, m = 4) {
  const ys = [].concat(xs).sort();
  if ((ys.length * n / m) % 1 !== 0) return ys[Math.floor(ys.length * n / m)];
  const middle = ys.length * n / m;
  const v1 = ys[middle];
  const v2 = ys[middle - 1];
  return (v1 + v2) / 2;
}

module.exports = { mad, mode, range, mean, variance, stdev, nQuart, median };
