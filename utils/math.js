/**
 * @param {!Array<!Number>|!TypedArray} xs
 * @returns {!Number}
 */
function product(xs) {
  return xs.reduce((v1, v2) => v1 * v2, 1);
}

/**
 * @param {!Array<!Number>|!TypedArray} xs
 * @returns {!Number}
 */
function sum(xs) {
  return xs.reduce((v1, v2) => v1 + v2, 0);
}

/**
 * @param n
 * @return {number}
 */
function factorial(n) {
  let acc = 1;
  while (n > 0) {
    acc *= n;
    n--;
  }
  return acc;
}

/**
 * @param {!Number} n
 * @param {!Number} k
 * @return {!Number} number of combinations
 */
function nCombinations(n, k) {
  return factorial(n) / (factorial(n - k) * factorial(k));
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

module.exports = {
  factorial,
  nCombinations,
  product,
  sum,
  argMin,
  argMax,
};
