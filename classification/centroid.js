const {Classifier} = require('./index');
const KMeans = require('../clustering/kmeans');
const {argMin, euclideanDist} = require("../utils");
const log = require('../utils/log');

class Centroid extends Classifier {

  constructor(data, labels, r = 0.1) {
    super(data, labels, r);
  }

  fit() {
    this.centroids = new KMeans(this.dataTrain, this.uniqueLabels.length).cluster();
    console.debug(`#centroids = ${this.centroids.length}`);

    // now map unique labels to centroids
    this.table = {};

    for (let c = 0; c < this.centroids.length; c++) {
      this.table[this.uniqueLabels[c]] = Array(this.centroids.length).fill(0);
    }

    for (let c = 0; c < this.centroids.length; c++) {
      for (let row = 0; row < this.dataTrain.length; row++) {
        this.table[this.labelsTrain[row]][c] += euclideanDist(this.dataTrain[row], this.centroids[c]);
      }
    }

    // provide label => centroidIdx mappings
    const centroidsIdxsLeft = new Set(Array(this.centroids.length).fill(0).map((_, idx) => idx));
    for (const l of this.uniqueLabels) {
      let closestCentroidIdx = centroidsIdxsLeft.values().next().value;
      let closestCentroidDist = this.table[l][closestCentroidIdx];
      for (const c of centroidsIdxsLeft) {
        const newDist = this.table[l][c];
        if(newDist < closestCentroidDist) {
          closestCentroidIdx = c;
          closestCentroidDist = newDist;
        }
      }
      this.table[l] = closestCentroidIdx;
      centroidsIdxsLeft.delete(closestCentroidIdx);
    }

    // provide centroidIdx => label mappings AS WELL
    for (const entry of Object.entries(this.table)) {
      const [l, c] = entry;
      delete this.table[l];
      this.table[c] = l;
    }
  }

  predict(x) {
    return this.table[argMin(this.centroids.map((_, idx) => idx), idx => euclideanDist(x, this.centroids[idx]))]
  }

  toString() {
    return `${this.constructor.name} { #centroids = ${this.centroids.length}, acc = ${this.score()}, #data = ${this.dataTrain.length} }`
  }
}

module.exports = Centroid;
