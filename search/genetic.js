const { randInRange, randCandidate, crossOver, mutate } = require('../utils/random');
const log = require('../utils/log');

class GeneticAlgo {
  /**
   * Genetic algorithms are used to explore a large search space when brute-force-search is not possible.
   * All you have to do is provide a fitness function that takes a 32-bit integer and computes a score.
   * This is a MAXIMISATION score so you are not minimising the error like in neural networks but rather maximising fitness of each candidate solution.
   * You probably want a decode function as well to extract the information from bits.
   *
   * The main parameters you should be concerned with is maxSec, popSize, popGrowthFactor and mutationP.
   *
   * If you see your population getting stuck in a local minimum increase mutationP and possibly popSize and popGrowthFactor.
   *
   * Various measures are taken to ensure that the algorithm does not loop forever:
   *
   * a) timeout (settable using maxSec)
   * b) keeping track of changes and terminating on lack of change (settable using minDiff)
   * c) counting rounds (settable using maxRounds)
   *
   * To make it converge faster you have the following options:
   *
   * a) priorityRatio (you can set it to 1/3 to occasionally favour the top third of the population for crossover/mutation see b))
   * b) priorityP (likelihood of selecting top candidate for crossover/mutation as opposed to any)
   *
   * This algorithm uses rank-based selection.
   *
   * Defaults are set to sane values.
   *
   * @param {!Function} f
   * @param {!Number} [popSize]
   * @param {!Number} [maxRounds] number of rounds (e.g. 10, 10000)
   * @param {!Number} [maxSec] time limit in seconds (e.g. 120, 30)
   * @param {!Number} [mutationP] probability of mutation (e.g. 0.01, 0.05)
   * @param {!Number} [popGrowthFactor] how much the population grows (e.g. x2, x10)
   * @param {!Number} [maxRoundsCheck] number of rounds to check if there was a change in fitness in the whole population
   * @param {!Number} [minDiff] minimum difference in fitness between maxRoundsCheck last populations
   * @param {!Number} [priorityRatio] ratio of candidates to prioritise
   * @param {!Number} [priorityP] probability of prioritising top candidates for selection for operators
   */
  constructor(f = n => n,
              popSize = 100,
              maxRounds = 10000,
              maxSec = 30,
              mutationP = 0.15,
              popGrowthFactor = 3,
              maxRoundsCheck = 5,
              minDiff = 0.5,
              priorityRatio = 0.5,
              priorityP = 0.15) {
    this.f = f;
    this.popSize = popSize;
    this.minDiff = minDiff;
    this.scores = new Float64Array(new ArrayBuffer(maxRoundsCheck * 8)).map((_, idx) => idx * minDiff + 1);
    this.priorityP = priorityP;
    this.priorityRatio = priorityRatio;
    this.candidates = new Uint32Array(new ArrayBuffer(Math.ceil(4 * popSize * popGrowthFactor))).map(_ => randCandidate());
    this.maxSec = maxSec;
    this.maxRounds = maxRounds;
    this.mutationP = mutationP;
    this.startTime = null;
    this.endTime = null;
    this.roundsLeft = maxRounds;
  }


  /**
   * The most fit candidates are first in the candidates array. Sometimes the algorithm will priorities the first candidates for cross-over / mutation.
   *
   * @return {!Number} candidate
   */
  get randCandidate() {
    return this.candidates[
      Math.trunc(randInRange(
        Math.random() >= this.priorityP
          ? this.popSize * this.priorityRatio
          : this.popSize
      ))];
  }

  /**
   * @return {!Number} number of rounds completed
   */
  get roundsDone() {
    return this.maxRounds - this.roundsLeft;
  }

  /**
   * Check if there was sufficient difference in overall population fitness.
   * Prevents the algorithm from getting stuck & making no progress.
   *
   * @return {!Number} difference in the last iterations
   */
  get diffScore() {
    return this.scores
      .slice(0, this.scores.length - 1)
      .map((s, idx) => Math.abs(s - this.scores[idx + 1]))
      .reduce((diff1, diff2) => Math.max(diff1, diff2), 0);
  }

  /**
   * @returns {!Uint32Array} best candidates ordered by fitness descending
   */
  search() {
    this.startTime = Date.now();
    Object.defineProperty(this, 'elapsedSec', { get: function() { return (Date.now() - this.startTime) / 1000; } });

    while (true) {
      // check for timeout
      if (this.elapsedSec >= this.maxSec) {
        log.debug(`timeout (${this.elapsedSec}s), did [${this.roundsDone}/${this.maxRounds}] rounds `);
        break;
        // check for rounds
      } else if (this.roundsLeft === 0) {
        log.debug(`did [${this.maxRounds}/${this.maxRounds}] rounds, took ${this.elapsedSec}s`);
        break;
        // check for stuck in local minimum
      } else if (this.diffScore < this.minDiff) {
        log.debug(`stuck after ${this.elapsedSec}s, [${this.roundsDone}/${this.maxRounds}] rounds`);
        break;
      } else this.roundsLeft--;

      for (let i = this.popSize; i < this.candidates.length; i++) {
        this.candidates[i] = Math.random() <= this.mutationP
          ? mutate(this.randCandidate)
          : crossOver(this.randCandidate, this.randCandidate);
      }

      console.debug(`seconds left: ${this.maxSec - this.elapsedSec}`);

      const cache = {};

      // take most fit
      // sort DESCENDING
      this.candidates = this.candidates.sort((a, b) => {
        const f1 = this.f(a);
        const f2 = this.f(b);
        cache[a] = f1;
        cache[b] = f2;
        if (f2 > f1) return 1;
        if (f2 < f1) return -1;
        else return 0;
      });

      // shift scores in a fixed-width typed array
      for (let i = 0; i < this.scores.length - 1; i++) {
        this.scores[i] = this.scores[i + 1];
      }

      this.scores[this.scores.length - 1] =
        this.candidates
          .slice(0, this.popSize)     // select top candidates
          .map(c => cache[c])     // fetch computed fitness
          .reduce((s1, s2) => s1 + s2, 0); // sum
    }
    this.endTime = Date.now();
    this.timeTaken = this.endTime - this.startTime;
    return this.candidates.subarray(0, this.popSize);
  }

  toString() {
    // if completed
    if (this.timeTaken) {
      return `GeneticAlgo { took = ${this.timeTaken}, roundDone = ${this.roundsDone}, #pop = ${this.candidates.length/this.popSize} }`;
    } else {
      return `GeneticAlgo { #pop = ${this.popSize}, growth = ${this.candidates.length / this.popSize}, mutationP = ${this.mutationP}, timeLimit: ${this.maxSec} }`;
    }
  }
}

module.exports = GeneticAlgo;
