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

/**
 * @param {!Array<*>} xs
 * @param {?Array<*>} [vocab]
 * @returns Object<Number> multiset
 */
function bag(xs, vocab) {
  if (vocab) {
    const v = new Set(vocab);
    xs = xs.filter(x => v.has(x));
  }
  const b = {};
  for (const x of xs) b[x] = (b[x] || 0) + 1;
  return b;
}

/**
 * @param {!Array<String>} words
 * @param {!Number} [n] len of vector
 * @returns Array<Number> count vector
 */
function hashingTrick(words, n = 100) {
  const counts = Array(n).fill(0);
  for (const s of words) {
    counts[(s.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) % n)]++;
  }
  return counts;
}

/**
 * @param {Array<Array<*>>|Array<*>} xs
 * @returns {Array<Array<*>>|Array<*>} transpose
 */
function transpose(xs) {
  if (xs[0].constructor.name !== 'Array') {
    return xs.map(x => [x]);
  }
  const m = Array(xs[0].length).fill(0).map(_ => Array(xs.length).fill(0));
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j < xs[i].length; j++) {
      m[j][i] = xs[i][j];
    }
  }
  return m;
}

/**
 * @param {!Array<*>} args
 * @param {!Function} f
 * @returns {Number} arg
 */
function argMax(args, f) {
  let best = args[0];
  let bestScore = f(best);
  for (const a of args.slice(1, args.length)) {
    const score = f(a);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

/**
 * @param {!Array<*>} args
 * @param {!Function} f
 * @returns {Number} arg
 */
function argMin(args, f) {
  let best = args[0];
  let bestScore = f(best);
  for (const a of args.slice(1, args.length)) {
    const score = f(a);
    if (score < bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

/**
 * @param {!Number} p probability in [0, 1]
 * @return {Number|Infinity}
 */
function information(p = 0.5) {
  return Math.log2(1/p);
}

/**
 *
 * @param {!Number} [a]
 * @param {!Number} [b]
 * @param {!Number} [step]
 * @returns {!Array<Number>} range
 */
function range(a = 0, b, step = 1) {
  if (b === undefined) return range(0, a, step);
  const xs = [];
  for (let i = a; i < b; i += step) xs.push(i);
  return xs;
}

/**
 * @param {Array<Number>} ps
 * @returns {!Number} entropy
 */
function entropy(ps) {
  return -(ps.map(p => p * Math.log2(p)).reduce((a, b) => a + b));
}

/**
 * Shuffles array in place.
 *
 * @param {!Array} a items An array containing the items.
 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = {
  euclideanDist: (xs, ys) => minkowskyDist(xs, ys, 2),
  manhattanDist: (xs, ys) => minkowskyDist(xs, ys, 1),
  hashingTrick,
  bag,
  shuffle,
  transpose,
  argMax,
  information,
  argMin,
  chebyshevDist,
  entropy,
  minkowskyDist,
};
