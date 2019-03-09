/**
 * @param {!Array<*>} xs
 * @param {!Array<*>} ys
 * @return {!Array<*>} child
 */
function crossOver(xs, ys) {
  const idx = Math.floor(Math.random() * (xs.length - 0.1));
  return xs.slice(0, idx).concat(ys.slice(idx, ys.length));
}

/**
 * @param {Array<*>} xs
 * @return {Array<*>} child
 */
function mutate(xs) {
  const idx1 = Math.floor(Math.random() * (xs.length - 0.1));
  const idx2 = Math.floor(Math.random() * (xs.length - 0.1));
  const child = [].concat(xs);
  child[idx2] = xs[idx1];
  return child;
}

class GeneticAlgo {
  /**
   * @param {!Array} candidates
   * @param {!Function} f
   * @param {!Number} [n] number of rounds (e.g. 10, 10000)
   * @param {!Number} [sec] time limit in seconds (e.g. 120, 30)
   * @param {!Number} [mutationP] probability of mutation (e.g. 0.01, 0.05)
   * @param {!Number} [popGrowthFactor] how much the population grows (e.g. x2, x10)
   * @param {!Number} [roundsCheck] number of rounds to check if there was a change in fitness in the whole population
   * @param {!Number} [minDiff] minimum combined difference in fitness between roundsCheck last populations
   * @param {!Function} [mutateF] mutation function
   * @param {!Function} [crossOverF] cross-over function
   */
  constructor(candidates, f, n = 10, sec = 30, mutationP = 0.05, popGrowthFactor = 2, roundsCheck = 5, minDiff = 0.5, mutateF = null, crossOverF = null) {
    this.f = f;
    this.minDiff = minDiff;
    this.popGrowthFactor = popGrowthFactor;
    this.roundsCheck = roundsCheck;
    this.candidates = candidates;
    this.sec = sec;
    this.n = n;
    this.mutationP = mutationP;
    if (!mutateF) this.mutateF = mutate;
    if (!crossOverF) this.crossOverF = crossOver;
  }

  /**
   * @return {!Array<*>} best candidates ordered by fitness descending
   */
  search() {
    let scores = [];
    const startTime = Date.now();
    const popSize = this.candidates.length;
    const maxPopSize = Math.floor(popSize * this.popGrowthFactor);
    let roundsLeft = this.n;
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
        if (Math.random() <= this.mutationP) {
          this.candidates.push(this.mutateF(this.candidates[this.candidates.length - 1]));
        } else {
          this.candidates.push(
              this.crossOverF(
                  this.candidates[Math.floor(Math.random() * (this.candidates.length - 0.1))],
                  this.candidates[Math.floor(Math.random() * (this.candidates.length - 0.1))]));
        }
      }

      const cache = new Map();

      // take most fit
      this.candidates = this.candidates.sort((a, b) => {
        const f1 = this.f(a);
        const f2 = this.f(b);
        cache.set(a, f1);
        cache.set(b, f2);
        // reverse sort
        if (f1 > f2) return -1;
        else if (f2 > f1) return 1;
        else return 0;
      }).slice(0, popSize);
      if (scores.length > this.roundsCheck) scores.shift();
      scores.push(this.candidates.map(c => cache.get(c)).reduce((s1, s2) => s1 + s2, 0));
    }
    return this.candidates;
  }
}

module.exports = GeneticAlgo;
