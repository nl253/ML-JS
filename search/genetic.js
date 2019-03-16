const { randInRange, randCandidate } = require('../utils/random');
const log = require('../utils/log');

/**
 * @param {!Number} x
 * @param {!Number} y
 * @param {!Number} maxLen
 * @returns {!Number} child
 */
function crossOver(x, y, maxLen = 32) {
  const idx = Math.trunc(randInRange(1, maxLen - 1));
  const shift = maxLen - idx;
  return (((x << shift) >>> shift) ^ ((y >>> shift) << shift)) & (2**maxLen - 1);
}

/**
 * @param {!String} xs
 * @param {!Number} maxLen
 * @returns {!String} child
 */
function mutate(xs, maxLen = 32) {
  const idx = Math.floor(randInRange(maxLen));
  let idx2 = Math.floor(randInRange(maxLen));
  while (idx === idx2) idx2 = Math.floor(randInRange(maxLen));

  /* Move p1'th to rightmost side */
  const bit1 =  (xs >> idx) & 1;
  /* Move p2'th to rightmost side */
  const bit2 =  (xs >> idx2) & 1;
  /* XOR the two bits */
  let x = (bit1 ^ bit2);
  /* Put the xor bit back to their original positions */
  x = (x << idx) | (x << idx2);
  /* XOR 'x' with the original number so that the two sets are swapped */
  return xs ^ x;
}

class GeneticAlgo {
  /**
   * @param {!Function} f
   * @param {!Number} [noCandidates]
   * @param {!Number} [n] number of rounds (e.g. 10, 10000)
   * @param {!Number} [sec] time limit in seconds (e.g. 120, 30)
   * @param {!Number} [mutationP] probability of mutation (e.g. 0.01, 0.05)
   * @param {!Number} [popGrowthFactor] how much the population grows (e.g. x2, x10)
   * @param {!Number} [roundsCheck] number of rounds to check if there was a change in fitness in the whole population
   * @param {!Number} [minDiff] minimum combined difference in fitness between roundsCheck last populations
   * @param {!Number} [priorityRatio] what ratio of candidates to prioritise
   * @param {!Number} [priorityP] probability of prioritising top candidates for selection for operators
   */
  constructor(f = n => n, noCandidates = 100, n = 10000, sec = 30, mutationP = 0.15, popGrowthFactor = 3.5, roundsCheck = 5, minDiff = 0.5, priorityRatio = 0.5, priorityP = 0.15) {
    this.f = f;
    this.noCandidates = noCandidates;
    this.minDiff = minDiff;
    this.scores = new Int32Array(new ArrayBuffer(roundsCheck * 8)).map((_, idx) => idx * minDiff + 1);
    this.priorityP = priorityP;
    this.priorityRatio = priorityRatio;
    const buf = new ArrayBuffer(Math.ceil(32 / 8 * noCandidates * popGrowthFactor));
    this.candidates = new Int32Array(buf);
    for (let i = 0; i < noCandidates; i++) {
      this.candidates[i] = randCandidate(32);
    }
    this.sec = sec;
    this.n = n;
    this.mutationP = mutationP;
  }

  /**
   * @returns {!Int32Array} best candidates ordered by fitness descending
   */
  search() {
    const SEC = 1000;
    const startTime = Date.now();
    const elapsedSec = () => (Date.now() - startTime) / SEC;
    let roundsLeft = this.n;
    const roundsDone = () => this.n - roundsLeft;

    /* the most fit candidates are first in the candidates array
     * priorities the first candidates for cross-over / mutation */
    const sample = () => this.candidates[
      Math.trunc(randInRange(
        Math.random() >= this.priorityP
          ? this.noCandidates * this.priorityRatio
          : this.noCandidates
      ))];

    while (true) {
      // check for timeout
      if (elapsedSec() >= this.sec) {
        log.debug(`timeout (${elapsedSec()}s), did [${roundsDone()}/${this.n}] rounds `);
        break;
        // check for rounds
      } else if (roundsLeft === 0) {
        log.debug(`did [${this.n}/${this.n}] rounds, took ${elapsedSec()}s`);
        break;
        // check for stuck in local minimum
      } else if (this.scores.slice(0, this.scores.length - 1)
                            .map((s, idx) => Math.abs(s - this.scores[idx + 1]))
                            .reduce((diff1, diff2) => Math.max(diff1, diff2), 0) < this.minDiff) {
        log.debug(`stuck after ${elapsedSec()}s, [${roundsDone()}/${this.n}] rounds`);
        break;
      } else roundsLeft--;

      for (let i = this.noCandidates; i < this.candidates.length; i++) {
        this.candidates[i] = Math.random() <= this.mutationP
          ? mutate(sample())
          : crossOver(sample(), sample());
      }

      const cache = {};

      // take most fit
      this.candidates = this.candidates.sort((a, b) => {
        const f1 = this.f(a);
        const f2 = this.f(b);
        cache[a] = f1;
        cache[b] = f2;
        if (f2 > f1) return 1;
        if (f2 < f1) return -1;
        else return 0;
      });

      for (let i = 0; i < this.scores.length - 1; i++) {
        this.scores[i] = this.scores[i + 1];
      }
      this.scores[this.scores.length - 1] = this.candidates.map(c => cache[c]).reduce((s1, s2) => s1 + s2, 0);
    }
    return this.candidates.subarray(0, this.noCandidates);
  }
}

module.exports = GeneticAlgo;
