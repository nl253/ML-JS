class Markov {
  constructor(graph = [
    {0: 1 / 3, 1: 1 / 3, 2: 1 / 3},
    {2: 1},
    {0: 1 / 2, 1: 1 / 2}]) {
    this.graph = graph;
  }

  pState(n, runs = 10000) {
    const index = {};
    let s = Math.floor(this.graph.length * Math.random());
    for (let i = 0; i < runs; i++) {
      s = this.graph[s];
    }
  }
}

module.exports = Markov;
