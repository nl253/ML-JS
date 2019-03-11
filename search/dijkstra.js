const Heap = require('tinyqueue');

class Dijkstra {
  /**
   * @param [s0] initial state
   * @param [nextStates] next state supplier (s => [s1, s2, ...])
   * @param [testF] testing predicate (s => bool)
   */
  constructor(
      s0 = 0,
      nextStates = s => Array(0).fill(0).map((x, idx) => x + idx + s),
      testF = s => s >= 1000) {
    this.s0 = s0;
    this.nextStates = nextStates;
    this.testF = testF;
  }

  /**
   * @return {*}
   */
  search() {
    const heap = new Heap([{path: [this.s0], dist: 0}], (e1, e2) => {
      if (e1.dist > e2.dist) return 1;
      else if (e1.dist === e2.dist) return 0;
      else return -1;
    });
    let focus;
    let state;
    do {
      focus = heap.pop();
      state = focus.path[focus.path.length - 1];
      for (const s of this.nextStates(state)) {
        heap.push({dist: focus.dist + 1, path: focus.path.concat([s])});
      }
    } while (heap.length > 0 && !this.testF(state)) ;
    return state;
  }
}

module.exports = Dijkstra;
