const { randInRange } = require('../utils/random');
const log = require('../utils/log');

/**
 * @param {string} xs
 * @param {string} ys
 * @returns {string} child
 */
function crossOver(xs, ys) {
  const idx = Math.floor(randInRange(0, xs.length));
  return xs.slice(0, idx).concat(ys.slice(idx, ys.length));
}

/**
 * @param {string} xs
 * @returns {string} child
 */
function mutate(xs) {
  const idx = Math.floor(randInRange(1, xs.length));
  const idx2 = Math.floor(randInRange(xs.length));
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
   * @param {!Number} [priorityP] probability of prioritising top candidates for selection for operators
   * @param {!Function} [mutateF] mutation function
   * @param {!Function} [crossOverF] cross-over function
   */
  constructor(candidates, f, n = 10000, sec = 30, mutationP = 0.15, popGrowthFactor = 2, roundsCheck = 5, minDiff = 0.5, priorityRatio = 10, priorityP = 0.15, mutateF = null, crossOverF = null) {
    this.f = f;
    this.minDiff = minDiff;
    this.priorityP = priorityP;
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
   * @returns {!Array<String>} best candidates ordered by fitness descending
   */
  search() {
    const SEC = 1000;
    const scores = [];
    const startTime = Date.now();
    const elapsedSec = () => (Date.now() - startTime) / SEC;
    const popSize = this.candidates.length;
    const maxPopSize = Math.floor(popSize * this.popGrowthFactor);
    let roundsLeft = this.n;
    const roundsDone = () => this.n - roundsLeft;

    /*
     * the most fit candidates are first in the candidates array
     * priorities the first candidates for cross-over / mutation
     */
    const sample = () => (Math.random() >= this.priorityP
      ? this.candidates[Math.floor(randInRange(Math.floor(this.candidates.length / this.priorityRatio)))]
      : this.candidates[Math.floor(randInRange(this.candidates.length))]);
    while (true) {
      // check for timeout
      if (elapsedSec() >= this.sec) {
        log.info(`timeout (${elapsedSec()}s), did [${roundsDone()}/${this.n}] rounds `);
        break;
        // check for rounds
      } else if (roundsLeft === 0) {
        log.info(`did [${this.n}/${this.n}] rounds, took ${elapsedSec()}s`);
        break;
        // check for stuck in local minimum
      } else if (scores.length >= this.roundsCheck && scores.slice(0, scores.length - 1).map((s, idx) => Math.abs(s - scores[idx + 1])).reduce((diff1, diff2) => diff1 + diff2, 0) < this.minDiff) {
        log.info(`stuck after ${elapsedSec()}s, [${roundsDone()}/${this.n}] rounds`);
        break;
      } else roundsLeft--;

      while (this.candidates.length < maxPopSize) {
        this.candidates.push(
          Math.random() <= this.mutationP
            ? this.mutateF(sample())
            : this.crossOverF(sample(), sample()),
        );
      }

      const cache = {};

      // take most fit
      this.candidates = this.candidates.sort((a, b) => {
        const f1 = this.f(a);
        const f2 = this.f(b);
        cache[a] = f1;
        cache[b] = f2;
        return f2.toLocaleString().localeCompare(f1.toLocaleString());
      }).slice(0, popSize);
      if (scores.length > this.roundsCheck) scores.shift();
      scores.push(
        this.candidates.map(c => cache[c]).reduce((s1, s2) => s1 + s2, 0));
    }
    return this.candidates;
  }
}

module.exports = GeneticAlgo;
