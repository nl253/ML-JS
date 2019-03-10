const {randInRange} = require('../utils/random');

class PSO {

  /**
   * @param {!Array<!Array<!Number>>} space
   * @param {!Function} costF
   * @param {!Number} [nParticles]
   * @param {!Number} [nIters]
   * @param {!Number} [sec]
   * @param {!Number} [gamma]
   * @param {!Number} [omega]
   */
  constructor(space, costF, nParticles = 50, nIters = 50, sec = 30, gamma = 0.03, omega = 0.03) {
    this.space = space;
    this.costF = costF;
    this.gamma = gamma;
    this.omega = omega;
    this.sec = sec;
    this.nIters = nIters;
    this.particles = Array(nParticles)
        .fill(0)
        .map(_ => Array(space.length).fill(0)
                                              .map((_, idx) => randInRange(space[idx][0], space[idx][1])));
    this.particlesBestKnown = [].concat(this.particles);
    this.globalPos = this.particlesBestKnown.reduce((p1, p2) => this.costF(p2) < this.costF(p1) ? p2 : p1);
    this.velocities = Array(nParticles).fill(0)
                                       .map(_ =>
        Array(space.length).fill(0).map((_, idx) => randInRange(-(space[idx][1] - space[idx][0]), space[idx][1] - space[idx][0])));
  }

  /**
   * @return {Array<*>} solution
   */
  search() {
    let toDo = this.nIters;
    const startTime = Date.now();
    while (true) {
      if (toDo === 0) {
        console.info(`[${this.nIters}/${this.nIters}] iterations, took ${(Date.now() - startTime) / 1000}s`);
        break;
      } else if ((Date.now() - startTime) / 1000 >= this.sec) {
        console.info(`time limit reached, took ${(Date.now() - startTime) / 1000}s, did ${this.nIters - toDo} iterations`);
        break;
      } else toDo--;
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = 0; j < this.particles[i].length; j++) {
          this.velocities[i][j] =
              this.gamma * this.velocities[i][j] +
              this.omega * Math.random() * (this.particlesBestKnown[i][j] - this.particles[i][j]) +
              this.omega * Math.random() * (this.globalPos - this.particles[i][j]);
        }
        this.particles[i] = this.particles[i].map((val, idx) => Math.max(this.space[idx][0], (val + this.velocities[i][idx]) % this.space[idx][1]));
        if (this.costF(this.particles[i]) < this.costF(this.particlesBestKnown[i])) {
          this.particlesBestKnown[i] = [].concat(this.particles[i]);
          if (this.particlesBestKnown[i] < this.globalPos) {
            this.globalPos = [].concat(this.particlesBestKnown[i]);
          }
        }
      }
    }
    return this.globalPos;
  }
}

module.exports = PSO;
