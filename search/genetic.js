const {randInRange} = require('../utils/random');

/**
 * @param {String} xs
 * @param {String} ys
 * @return {String} child
 */
function crossOver(xs, ys) {
  const idx = Math.floor(randInRange(0, xs.length));
  return xs.slice(0, idx).concat(ys.slice(idx, ys.length));
}

/**
 * @param {String} xs
 * @return {String} child
 */
function mutate(xs) {
  let idx = Math.floor(randInRange(1, xs.length));
  let idx2 = Math.floor(randInRange(0, xs.length));
  return (Math.random() <= 0.3
      ? xs.slice(0, idx) + xs[idx2] + xs.slice(idx + 1, xs.length)
      : xs.slice(0, idx - 1) + xs[idx2] + xs.slice(idx, xs.length)).slice(0, xs.length);
}

class GeneticAlgo {
  /**
   * @param {!Array<!String>} candidates
   * @param {!Function} f
   * @param {!Number} [n] number of rounds (e.g. 10, 10000)
   * @param {!Number} [sec] time limit in seconds (e.g. 120, 30)
   * @param {!Number} [mutationP] probability of mutation (e.g. 0.01, 0.05)
   * @param {!Number} [popGrowthFactor] how much the population grows (e.g. x2, x10)
   * @param {!Number} [roundsCheck] number of rounds to check if there was a change in fitness in the whole population
   * @param {!Number} [minDiff] minimum combined difference in fitness between roundsCheck last populations
   * @param {!Number} [priorityRatio] what ratio of candidates to prioritise
   * @param {!Function} [mutateF] mutation function
   * @param {!Function} [crossOverF] cross-over function
   */
  constructor(candidates, f, n = 100000, sec = 30, mutationP = 0.05, popGrowthFactor = 2, roundsCheck = 5, minDiff = 0.5, priorityRatio = 10, mutateF = null, crossOverF = null) {
    this.f = f;
    this.minDiff = minDiff;
    this.popGrowthFactor = popGrowthFactor;
    this.roundsCheck = roundsCheck;
    this.priorityRatio = priorityRatio;
    this.candidates = candidates;
    this.sec = sec;
    this.n = n;
    this.mutationP = mutationP;
    if (!mutateF) this.mutateF = mutate;
    if (!crossOverF) this.crossOverF = crossOver;
  }

  /**
   * @return {!Array<String>} best candidates ordered by fitness descending
   */
  search() {
    let scores = [];
    const startTime = Date.now();
    const popSize = this.candidates.length;
    const maxPopSize = Math.floor(popSize * this.popGrowthFactor);
    let roundsLeft = this.n;
    // the most fit candidates are first in the candidates array
    // priorities the first candidates for cross-over / mutation
    const sample = () => Math.random() >= 0.75
        ? this.candidates[Math.floor(randInRange(0, Math.floor(this.candidates.length/this.priorityRatio)))]
        : this.candidates[Math.floor(randInRange(0, this.candidates.length))] ;
    while (true) {
      // check for timeout
      if (((Date.now() - startTime) / 1000) >= this.sec) {
        console.info(`timeout after ${this.n - roundsLeft} rounds, took ${(Date.now() - startTime) / 1000}s, quitting`);
        break;
        // check for rounds
      } else if (roundsLeft === 0) {
        console.info(`did ${this.n} rounds, took ${(Date.now() - startTime) / 1000}s, quitting`);
        break;
        // check for stuck in local minimum
      } else if (scores.length >= this.roundsCheck && scores.slice(0, scores.length - 1).map((s, idx) => Math.abs(s - scores[idx + 1])).reduce((diff1, diff2) => diff1 + diff2, 0) < this.minDiff) {
        console.info(`no changes for ${this.roundsCheck} rounds, did ${this.n - roundsLeft} rounds, took ${(Date.now() - startTime) / 1000}s, quitting`);
        break;
      } else roundsLeft--;

      while (this.candidates.length < maxPopSize) {
        this.candidates.push(
            Math.random() <= this.mutationP
                ? this.mutateF(sample())
                : this.crossOverF(sample(), sample()));
      }

      const cache = {};

      // take most fit
      this.candidates = this.candidates.sort((a, b) => {
        const f1 = this.f(a);
        const f2 = this.f(b);
        cache[a] = f1;
        cache[b] = f2;
        // reverse sort
        if (f1 > f2) return -1;
        else if (f2 > f1) return 1;
        else return 0;
      }).slice(0, popSize);
      if (scores.length > this.roundsCheck) scores.shift();
      scores.push(this.candidates.map(c => cache[c]).reduce((s1, s2) => s1 + s2, 0));
    }
    return this.candidates;
  }
}

module.exports = GeneticAlgo;
