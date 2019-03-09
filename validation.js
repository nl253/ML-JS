const {mean} = require('./utils');

class CrossValidator {
  /**
   * @param {Model} model
   * @param {Array<Array<*>>} data
   * @param {Array<*>} labels
   * @param {Number} k
   */
  constructor(model, data, labels, k = 10) {
    this.k = k;
    this.data = data;
    this.labels = labels;
    this.model = model;
  }

  score() {
    const step = Math.floor(this.data.length / this.k);
    const scores = [];

    for (let i = 0; i < this.k; i++) {

      const testingData = this.data.slice(i * step, (i + 1) * step);
      const testingLabels = this.labels.slice(i * step, (i + 1) * step);

      const trainingData = this.data.slice(0, i * step);
      this.data.slice((i + 1) * step, this.data.length).forEach(d => trainingData.push(d));

      const trainingLabels = this.labels.slice(0, i * step);
      this.labels.slice((i + 1) * step, this.data.length).forEach(l => trainingLabels.push(l));

      const model = new this.model(trainingData, trainingLabels);
      scores.push(
          testingData.filter((d, idx) => model.predict(d) === testingLabels[idx]).length
          / testingData.length);

    }
    return mean(scores);
  }
}

module.exports = {CrossValidator};
