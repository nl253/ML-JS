const fs = require('fs');

/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @param {Number} [p]
 * @returns {!Number}
 */
function minkowskyDist(xs, ys, p = 1) {
  return xs.map((x, idx) => (x - ys[idx]) ** p).reduce((x, y) => x + y) **
      (1 / p);
}

/**
 * @param {!String} filePath
 * @returns {string[][]}
 */
function readCSV(filePath) {
  return fs.readFileSync(filePath).
      toString('utf-8').
      split(/\r\n|\n\r?/).
      map(x => x.split(','));
}

/**
 * @param {!String} filePath
 * @returns {JSON}
 */
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath).toString('utf-8'));
}

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
 * @param {?Array<*>} [vocabulary]
 * @return Object<Number> multiset
 */
function bag(xs, vocabulary) {
  if (vocabulary) {
    const v = new Set(vocabulary);
    xs = xs.filter(x => v.has(x));
  }
  const b = {};
  for (const x of xs) b[x] = (b[x] || 0) + 1;
  return b;
}

/**
 * @param {!Array<String>} words
 * @param {!Number} [n] len of vector
 * @return Array<Number> count vector
 */
function hashingTrick(words, n = 100) {
  const counts = Array(n).fill(0);
  for (const s of words) counts[(s.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0) % n)]++;
  return counts;
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

// /**
//  * @param {Array<*>} xs
//  * @return {Array<*>} transpose of xs
//  */
// function transpose(xs) {
//   const result = [];
//   for (let col = 0; col < xs[0].length; col++) {
//     result[col] = [];
//     for (let row = 0; row < xs.length; row++) {
//       result[col].push(xs[row][col]);
//     }
//   }
//   return result;
// }

module.exports = {
  euclideanDist: (xs, ys) => minkowskyDist(xs, ys, 2),
  manhattanDist: (xs, ys) => minkowskyDist(xs, ys, 1),
  hashingTrick,
  bag,
  range,
  stdev,
  variance,
  mode,
  minkowskyDist,
  readCSV,
  mean,
  readJSON,
};
