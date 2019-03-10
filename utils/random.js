/**
 * @param {!Number} a min value
 * @param {!Number} b max value
 * @return {!Number} random number
 */
function randInRange(a, b) {
  return a + (b - a) * Math.random();
}

/**
 * @param {!Number} [n] #elems
 * @param {!Number} [min] min value
 * @param {!Number} [max] max value
 * @return {!Array<Number>} array
 */
function randArr(n = 100, min = 0, max = 1) {
  return Array(n).fill(0).map(_ => randInRange(min, max));
}

/**
 * @param {!Number} [n] #rows
 * @param {!Number} [m] #cols
 * @param {!Number} [min] min value
 * @param {!Number} [max] max value
 * @return {!Array<!Array<!Number>>} array
 */
function randMatrix(n = 100, m = 10, min = 0, max = 1) {
  return Array(n).fill(0).map(_ => randArr(m, min, max));
}

/**
 * @param {!Number} [n]
 * @return {String} bit string
 */
function randBitStr(n = 100) {
  return randArr(n, 0, 1).map(v => Math.round(v)).join('');
}

module.exports = {randArr, randMatrix, randBitStr, randInRange};
