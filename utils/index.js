const fs = require("fs");

/**
 * @param {Array<Number>} xs
 * @param {Array<Number>} ys
 * @param {Number} p
 * @returns {Number}
 */
function minkowskyDist(xs, ys, p = 1) {
  return xs.map((x, idx) => (x - ys[idx])**p).reduce((x, y) => x + y)**(1/p);
}

/**
 * @param {String} filePath
 * @returns {string[][]}
 */
function readCSV(filePath) {
  return fs.readFileSync(filePath).toString('utf-8').split(/\r\n|\n\r?/).map(x => x.split(','));
}

/**
 * @param {String} filePath
 * @returns {JSON}
 */
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath).toString('utf-8'));
}

module.exports = {
  euclideanDist: (xs, ys) => minkowskyDist(xs, ys, 2),
  manhattanDist: (xs, ys) => minkowskyDist(xs, ys, 1),
  minkowskyDist,
  readCSV,
  readJSON,
};
