const log = require('../utils/log');

class DepthFirstSearch {
  /**
   * @param {*} [s0] initial state
   * @param {!Function} [nextStates] (state -> Array<state>)
   * @param {!Function} [testF] predicate (state -> bool)
   * @param {!Number} [limit]
   */
  constructor(
      s0 = 0,
      nextStates = s => Array(2).fill(0).map((x, idx) => x + s + idx),
      testF = s => s >= 10000,
      limit = -1) {
    this.s0 = s0;
    this.nextStates = nextStates;
    this.testF = testF;
    this.limit = limit;
    this.depth = 0;
  }

  /**
   * @return {*} state
   */
  search() {
    if (this.testF(this.s0)) return this.s0;
    if (this.depth >= this.limit) return null;
    this.depth++;
    for (const s of this.nextStates(this.s0)) {
      this.s0 = s;
      const candidate = this.search();
      if (candidate !== null) {
        log.info(`found result on ${this.depth} lvl of depth`);
        return candidate;
      }
    }
    this.depth--;
    return null;
  }
}

module.exports = DepthFirstSearch;
