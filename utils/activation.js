/**
 * @param {!Number} n
 * @return {!Number}
 */
function logSigmoid(n) {
  return Math.E**n / (Math.e**n + 1);
}

module.exports = {logSigmoid};
