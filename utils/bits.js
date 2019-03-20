const {randInRange} = require('./random');

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

module.exports = {mutate, crossOver};
