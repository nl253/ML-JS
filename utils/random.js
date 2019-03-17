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

/**
 * @param {!Number} maxBits
 * @return {!Number} candidate
 */
function randCandidate(maxBits = 32) {
  return Math.floor(randInRange(0, 2**maxBits - 1));
}

/**
 * @param {!Number} x
 * @param {!Number} y
 * @param {!Number} maxLen
 * @returns {!Number} child
 */
function crossOver(x, y, maxLen = 32) {
  const idx = Math.trunc(randInRange(1, maxLen));
  const yShift = maxLen - idx;
  return (((x << idx) & 2 ** maxLen - 1) >> idx) ^ ((y >> yShift) << yShift);
}

/**
 * @param {!String} xs
 * @param {!Number} maxLen
 * @returns {!String} child
 */
function mutate(xs, maxLen = 32) {
  const idx = Math.floor(randInRange(maxLen));
  let idx2 = Math.floor(randInRange(maxLen));
  while (idx === idx2) idx2 = Math.floor(randInRange(maxLen));

  /* Move p1'th to rightmost side */
  const bit1 =  (xs >>> idx) & 1;
  /* Move p2'th to rightmost side */
  const bit2 =  (xs >>> idx2) & 1;
  /* XOR the two bits */
  let x = (bit1 ^ bit2);
  /* Put the xor bit back to their original positions */
  x = (x << idx) | (x << idx2);
  /* XOR 'x' with the original number so that the two sets are swapped */
  return xs ^ x;
}

module.exports = {randArrEl, randNArrEls, randArr, randMatrix, randBitStr, randInRange, randCandidate, mutate, crossOver};
