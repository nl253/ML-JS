/**
 * @param {!Function} f
 * @param {!Function} fPrime
 * @param {!Number} [guess]
 * @return {Number}
 */
function newtonsMethod(f, fPrime, guess) {
  if (guess === undefined) {
    guess = Math.random();
  }
  while (true) {
    const newGuess = guess - f(guess) / fPrime(guess);
    if (guess === newGuess) return guess;
    else guess = newGuess;
  }
}

/**
 * @param {Array<*>} xs
 * @param {!Number} n
 * @return {Array<*>}
 */
function* combinations(xs, n) {
  if (n === 1) {
    for (const x of xs) yield [x];
    return;
  }
  for (let i = 0; i < xs.length; i++) {
    const prefix = [xs[i]];
    for (const subCombo of combinations(xs.slice(i + 1), n - 1)) {
      yield prefix.concat(subCombo);
    }
  }
}

/**
 * @param {!Array<*>} xs
 * @param {!Number} i
 * @param {!Number} j
 */
function swap(xs, i, j) {
  const save = xs[i];
  xs[i] = xs[j];
  xs[j] = save;
}

/**
 * @param {Array<*>} xs
 * @return {Array<*>}
 */
function* permutations(xs, n) {
  if (n  === undefined) n = xs.length;
  if (n === 1) {
    yield xs;
    return;
  }

  yield * permutations(xs, n - 1);

  for (let i = 0; i < n - 1; i++) {
    if (n % 2 === 0) {
      swap(xs, i, n - 1);
    } else {
      swap(xs, 0, n - 1);
    }
    yield * permutations(xs, n - 1);
  }
}

module.exports = {newtonsMethod, combinations, permutations};
