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

module.exports = {newtonsMethod, combinations};
