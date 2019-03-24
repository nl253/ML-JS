const log = require('../utils/log');
const { mean, arange, toTypedArray, getTypedArray } = require('../utils');

class Regressor {
  /**
   * @param {!DF} data
   * @param {TypedArray} labels
   * @param {!Number} [r]
   */
  constructor(data, labels, r = 0.1, nFolds = 10) {
    this.r = r;
    this.data = data;
    this.labels = labels;
    this.nFolds = nFolds;
  }

  get scoreCV() {
    return mean(
      arange(this.nFolds)
        .cast('Float64')
        .map((idx) => {
          const testDataLen = Math.floor((1 / this.nFolds) * this.data.length);
          const xs = this.data.slice(0, idx * testDataLen).concat(this.data.slice(idx * testDataLen, (idx + 1) * testDataLen));
          const ys = this.labels.slice(0, idx * testDataLen).concat(this.labels.slice(idx * testDataLen, (idx + 1) * testDataLen));
          return (new this.constructor(xs, ys, this.r, this.nFolds)).score;
        })
    );
  }

  /**
   * @returns {!Array<*>} labels for the test data
   */
  get labelsTest() {

  }

  /**
   * @returns {!TypedArray} labels for the training data
   */
  get labelsTrain() {
  }

  /**
   * @returns {!DF} testing data
   */
  get dataTest() {

  }

  /**
   * @returns {!DF} training data
   */
  get dataTrain() {
  }

  /**
   * @returns {!String} name
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * Initialise (learn) the model.
   */
  fit() {
    throw new Error('Model.fit() needs to be overridden');
  }

  /**
   * @returns {Number} accuracy score in [0, 1]
   */
  get score() {
    return this.dataTest.filter((row, idx) => this.predict(row) === this.labelsTest[idx]).length / this.dataTest.length;
  }

  /**
   * @param {Array<*>} row
   * @returns {*} prediction
   */
  predict(row) {
    return log.warn('Model.predict(row) needs to be overridden');
  }

  /**
   * @returns {!Classifier} clone of the classifier
   */
  get clone() {
    const copy = new this.constructor(this.data.clone(), [].concat(this.labels), this.r);
    for (const k of Object.keys(this)) {
      copy[k] = this[k];
    }
    return copy;
  }

  toString() {
    return `${this.name} { #features = ${this.data.nCols}, ${this.uniqueLabels.length <= 5 ? `uniqueLabels = [${this.uniqueLabels.join(', ')}]` : `#uniqueLabels = ${this.uniqueLabels.length}`}, #dataTrain = ${this.dataTrainCount}, #dataTest = ${this.dataTestCount}, r = ${this.r} }`;
  }
}

module.exports = Regressor;
