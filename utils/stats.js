const { sum } = require('./math');
const { bag } = require('.');

/**
 * @param {!Array<!Number>|!TypedArray} nums
 * @return {!Number}
 */
function mean(nums) {
  return sum(nums) / nums.length;
}

/**
 * @param {!Array<!Number>|!TypedArray} nums non-empty array of nums
 * @returns {number}
 */
function variance(nums) {
  const mu = mean(nums);
  return sum(nums.map(x => (x - mu) ** 2)) / nums.length;
}

/**
 * @param {!Array<!Number>|!TypedArray} nums non-empty array of nums
 * @returns {number}
 */
function stdev(nums) {
  return Math.sqrt(variance(nums));
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
 * @param {!Array<!Number>|!TypedArray} xs
 * @returns {!Number} median
 */
function median(xs) {
  return nQuart(xs, 1, 2);
}

/**
 * @param {!Array<!Number>|!TypedArray} xs
 * @param {!Number} [n]
 * @param {!Number} [m]
 * @returns {!number} nth quartile
 */
function nQuart(xs, n = 2, m = 4) {
  const ys = [].concat(Array.from(xs)).sort();
  if ((ys.length * n / m) % 1 !== 0) return ys[Math.floor(ys.length * n / m)];
  const middle = ys.length * n / m;
  const v1 = ys[middle];
  const v2 = ys[middle - 1];
  return (v1 + v2) / 2;
}

/**
 * @param {!Array<!Number>|!TypedArray} xs
 * @returns {!Number}
 */
function min(xs) {
  return xs.reduce((v1, v2) => Math.min(v1, v2));
}

/**
 * @param {!Array<!Number>|!TypedArray} xs
 * @returns {!Number}
 */
function max(xs) {
  return xs.reduce((v1, v2) => Math.max(v1, v2));
}

/**
 * @param {!Array<Number>} xs
 * @returns {{min: number, max: number}}
 */
function range(xs) {
  return max(xs) - min(xs);
}

module.exports = {
  mad,
  max,
  mean,
  median,
  min,
  mode,
  nQuart,
  stdev,
  range,
  variance,
};
