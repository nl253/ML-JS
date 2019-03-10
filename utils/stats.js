
/**
 * @param {!Array<!Number>} nums non-empty array of nums
 * @return {Number}
 */
function mean(nums) {
  return nums.reduce((x1, x2) => x1 + x2) / nums.length;
}

/**
 * @param {!Array<!Number>} nums non-empty array of nums
 * @return {Number}
 */
function variance(nums) {
  const mu = mean(nums);
  return nums.map(x => (x - mu) ** 2).reduce((x1, x2) => x1 + x2) / nums.length;
}

/**
 * @param {!Array<!Number>} nums non-empty array of nums
 * @return {Number}
 */
function stdev(nums) {
  return Math.sqrt(variance(nums));
}

/**
 * @param {!Array<Number>} xs
 * @return {{min: Number, max: Number}}
 */
function range(xs) {
  return xs.reduce((x1, x2) => Math.max(x1, x2)) -
      xs.reduce((x1, x2) => Math.min(x1, x2));
}

/**
 * @param {!Array<*>} xs
 * @return {*} mode
 */
function mode(xs) {
  return Object
  .entries(bag(xs))
  .reduce(([val1, count1], [val2, count2]) =>
      count2 > count1
          ? [val2, count2]
          : [val1, count1])[0];
}

module.exports = {mode, range, mean, variance, stdev};
