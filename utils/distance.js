/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @param {!Number} [p]
 * @returns {!Number}
 */
function minkowskyDist(xs, ys, p = 1) {
  return xs.map((x, idx) => (x - ys[idx]) ** p).reduce((x, y) => x + y) ** (1 / p);
}

/**
 * @param {!Array<!Number>} xs
 * @param {!Array<!Number>} ys
 * @returns {!Number}
 */
function chebyshevDist(xs, ys) {
  let greatestDim = 0;
  let greatestDist = Math.abs(xs[0] - ys[0]);
  for (let i = 1; i < xs.length; i++) {
    const d = Math.abs(xs[i] - ys[i]);
    if (d > greatestDist) {
      greatestDist = d;
      greatestDim = i;
    }
  }
  return greatestDist;
}

module.exports = {
  chebyshevDist,
  minkowskyDist,
  manhattanDist: (xs, ys) => minkowskyDist(xs, ys, 1),
  euclideanDist: (xs, ys) => minkowskyDist(xs, ys, 2),
};

