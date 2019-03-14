const log = require('../utils/log');
const { randInRange } = require('../utils/random');

class PSO {
  /**
   * @param {!Array<!Array<!Number>>} [space]
   * @param {!Function} [costF]
   * @param {!Number} [nParticles]
   * @param {!Number} [nIters]
   * @param {!Number} [sec]
   * @param {!Number} [gamma]
   * @param {!Number} [omega]
   * @param {!Number} [roundsCheck]
   * @param {!Number} [minCombDiff]
   */
  constructor(space = [[0, 1], [0, 1], [0, 1]],
    costF = c => c.reduce((x, y) => x + y, 0),
    nParticles = 65,
    nIters = 10000,
    sec = 30,
    gamma = 0.03,
    omega = 0.03,
    roundsCheck = 10,
    minCombDiff = 0.5) {
    this.space = space;
    this.costF = costF;
    this.gamma = gamma;
    this.omega = omega;
    this.minCombDiff = minCombDiff;
    this.roundsCheck = roundsCheck;
    this.sec = sec;
    this.nIters = nIters;
    this.particles = Array(nParticles)
      .fill(0)
      .map(_ => Array(space.length)
        .fill(0)
        .map((_, idx) => randInRange(space[idx][0], space[idx][1])));
    this.particlesBestKnown = [].concat(this.particles);
    this.globalPos = this.particlesBestKnown.reduce((p1, p2) => (this.costF(p2) < this.costF(p1) ? p2 : p1));
    this.velocities = Array(nParticles).fill(0).map(_ => Array(space.length)
      .fill(0)
      .map((_, idx) => randInRange(-(space[idx][1] - space[idx][0]),
        space[idx][1] - space[idx][0])));
  }

  /**
   * @returns {Array<*>} solution
   */
  search() {
    const nParticles = this.particles.length;
    const nDim = this.particles[0].length;
    let itersLeft = this.nIters;
    const startTime = Date.now();
    const scores = [this.globalPos];
    const elapsedSec = () => (Date.now() - startTime) / 1000;
    const nItersDone = () => this.nIters - itersLeft;
    while (true) {
      if (itersLeft === 0) {
        log.info(`[${this.nIters}/${this.nIters}] iterations, took ${elapsedSec()}s`);
        break;
      } else if (elapsedSec() >= this.sec) {
        log.info(`time limit reached, took ${elapsedSec()}s, did ${nItersDone()} iterations`);
        break;
      } else if (scores.length >= this.roundsCheck
          && scores.slice(0, scores.length - 1)
            .map((s, idx) => Math.abs(s - scores[idx + 1]))
            .reduce((s1, s2) => s1 + s2) < this.minCombDiff) {
        log.info(`no changes for ${this.roundsCheck} rounds, took ${elapsedSec()}s, did ${nItersDone()} iterations`);
        break;
      } else itersLeft--;
      for (let p = 0; p < nParticles; p++) {
        for (let dim = 0; dim < nDim; dim++) {
          this.velocities[p][dim] = this.gamma * this.velocities[p][dim]
              + this.omega * Math.random()
              * (this.particlesBestKnown[p][dim] - this.particles[p][dim])
              + this.omega * Math.random()
              * (this.globalPos - this.particles[p][dim]);
        }
        this.particles[p] = this.particles[p].map(
          (val, idx) => Math.max(
            this.space[idx][0],
            (val + this.velocities[p][idx]) % this.space[idx][1],
          ),
        );
        if (this.costF(this.particles[p]) < this.costF(this.particlesBestKnown[p])) {
          this.particlesBestKnown[p] = [].concat(this.particles[p]);
          if (this.particlesBestKnown[p] < this.globalPos) {
            this.globalPos = [].concat(this.particlesBestKnown[p]);
            scores.push(this.globalPos);
            if (scores.length > this.roundsCheck) scores.shift();
          }
        }
      }
    }
    return this.globalPos;
  }
}

module.exports = PSO;
