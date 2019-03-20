/**
 * @param {!Number} a min val
 * @param {!Number} [b] max val
 * @return {!Number} random number
 */
function randInRange(a, b) {
  return b === undefined
    ? randInRange(0, a)
    : a + (b - a) * Math.random();
}

/**
 * @param {!Number} a min val
 * @param {!Number} [b] max val
 * @return {!Number} random number
 */
function randInt(a, b) {
  return Math.floor(randInRange(a, b));
}

/**
 * @param {!Number} [n] #elems
 * @param {!Number} [min] min val
 * @param {!Number} [max] max val
 * @return {!Array<Number>} array
 */
function randArr(n = 100, min = 0, max = 1) {
  return Array(n).fill(0).map(_ => randInRange(min, max));
}

/**
 * @param {!Array<*>} xs
 * @return {*} element
 */
function randArrEl(xs) {
  return Math.floor(randInRange(0, xs.length));
}

/**
 * @param {Array<!Number>} xs
 * @param {!Number} n
 * @return {*}
 */
function randNArrEls(xs, n) {
  if (n === null) return randNArrEls(xs, xs.length);
  const cpy = [].concat(xs);
  const sample = [];
  while (sample.length < n) {
    const idx = Math.floor(Math.random() * cpy.length);
    sample.push(cpy.splice(idx, 1)[0]);
  }
  return sample;
}

/**
 * @param {!Number} [n] #rows
 * @param {!Number} [m] #cols
 * @param {!Number} [min] min val
 * @param {!Number} [max] max val
 * @return {!Array<!Array<!Number>>} array
 */
function randMatrix(n = 32, m = 32, min = 0, max = 1) {
  return Array(n).fill(0).map(_ => randArr(m, min, max));
}

/**
 * @param {!Number} [n]
 * @return {!String} bit string
 */
function randBitStr(n = 32) {
  return randArr(n, 0, 1).map(v => Math.round(v)).join('');
}

/**
 * @param {!Number} maxBits
 * @return {!Number} candidate
 */
function randCandidate(maxBits = 32) {
  return Math.floor(randInRange(0, 2**maxBits - 1));
}

module.exports = {randArrEl, randNArrEls, randArr, randMatrix, randBitStr, randInRange, randCandidate, intInRange: randInt};
