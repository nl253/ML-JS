class BreadthFirstSearch {
  /**
   * @param {*} [s0] initial state
   * @param {!Function} [nextStates] (state -> Array<state>)
   * @param {!Function} [testF] predicate (state -> bool)
   */
  constructor(
      s0 = 0,
      nextStates = s => Array(2).fill(0).map((x, idx) => x + s + idx),
      testF = s => s >= 1000) {
    this.s0 = s0;
    this.nextStates = nextStates;
    this.testF = testF;
  }

  /**
   * @return {*} state
   */
  search() {
    let queue = [this.s0];
    let focus;
    do {
      focus = queue[0];
      queue = queue.slice(1).concat(this.nextStates(focus));
    } while (queue.length > 0 && !this.testF(focus));
    return queue.length === 0 ? null : focus;
  }
}

module.exports = BreadthFirstSearch;
