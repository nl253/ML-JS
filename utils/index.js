/**
 * @param {!Array<*>} xs
 * @param {?Array<*>} [vocab]
 * @returns Map<Number> multiset
 */
function bag(xs, vocab = null) {
  if (vocab !== null) {
    const v = new Set(vocab);
    return bag(xs.filter(x => v.has(x)))
  }
  const b = new Map();
  for (const x of xs) b.set(x, (b.get(x) || 0) + 1);
  Object.defineProperty(b, 'mostFreq', {get: function () {
      if (this._mostFreq) return this._mostFreq;
      this._mostFreq =  Array.from(this.entries()).sort((a, b) => a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0)[0][0];
      return this._mostFreq;
    }});
  return b;
}

/**
 * @param {!String} s
 * @return {!Number}
 */
function hashStr(s) {
  let hash = 0;
  if (s.length === 0) return hash;
  for (let i = 0; i < s.length; i++) {
    hash  = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * @param {!Number} p probability in [0, 1]
 * @return {Number|Infinity}
 */
function information(p = 0.5) {
  return Math.log2(1/p);
}

/**
 * @param {Array<Number>} ps
 * @returns {!Number} entropy
 */
function entropy(ps) {
  return -(ps.map(p => p * Math.log2(p)).reduce((a, b) => a + b));
}

/**
 * @param {Array<*>} votes
 * @return {*}
 */
function majorityVote(votes) {
  return bag(votes).mostFreq;
}

module.exports = {
  bag,
  entropy,
  hashStr,
  information,
  majorityVote,
};
