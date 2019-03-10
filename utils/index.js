/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @param {Number} [p]
 * @returns {!Number}
 */
function minkowskyDist(xs, ys, p = 1) {
  return xs.map((x, idx) => (x - ys[idx]) ** p).reduce((x, y) => x + y) ** (1 / p);
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

module.exports = {
  euclideanDist: (xs, ys) => minkowskyDist(xs, ys, 2),
  manhattanDist: (xs, ys) => minkowskyDist(xs, ys, 1),
  hashingTrick,
  bag,
  minkowskyDist,
};
