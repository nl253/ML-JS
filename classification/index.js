const log = require('../utils/log');

class Classifier {
  /**
   * @param {!DF} data
   * @param {Array<*>} labels
   * @param {Number} [r]
   */
  constructor(data, labels, r = 0.1) {
    this.r = r;
    this.data = data;
    this.labels = labels;
    this.uniqueLabels = Array.from(new Set(labels));
  }

  /**
   * @return {!Number} number of rows in training data
   */
  get dataTrainCount() {
    return this.data.length - this.dataTestCount;
  }

  /**
   * @return {!Number} number of rows in testing data
   */
  get dataTestCount() {
    return Math.floor(this.data.length * this.r);
  }

  /**
   * @return {!Array<*>} labels for the test data
   */
  get labelsTest() {
    return this.labels.slice(0, this.dataTestCount);
  }

  /**
   * @return {!Array<*>} labels for the training data
   */
  get labelsTrain() {
    return this.labels.slice(this.dataTestCount);
  }

  /**
   * @return {!DF} testing data
   */
  get dataTest() {
    if (this._dataTestCache !== undefined) {
      return this._dataTestCache;
    }
    const df = this.data.slice(0, this.dataTestCount);
    this._dataTestCache = df;
    return df
  }

  /**
   * @return {!DF} training data
   */
  get dataTrain() {
    if (this._dataTrainCache !== undefined) {
      return this._dataTrainCache;
    }
    const df = this.data.slice(this.dataTestCount, this.data.length);
    this._dataTrainCache = df;
    return df;
  }

  /**
   * @return {!String} name
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
   * @return {Number} accuracy score in [0, 1]
   */
  get score() {
    return this.dataTest.filter((row, idx) => {
      const p = this.predict(row);
      const a = this.labelsTest[idx];
      // console.log(p);
      // console.log(a);
      return p === a;
    }).length / this.dataTestCount;
  }

  /**
   * @param {Array<*>} row
   * @return {*} prediction
   */
  predict(row) {
    return log.warn('Model.predict(row) needs to be overridden');
  }

  /**
   * @return {!Classifier} clone of the classifier
   */
  clone(copyData = false) {
    const copy = new this.constructor(copyData ? this.data.clone() : this.data, copyData ? [].concat(this.labels) : this.labels, this.r);
    for (let k of Object.keys(this)) {
      copy[k] = this[k]
    }
    return copy;
  }

  toString() {
    return `${this.name} { #features = ${this.data.nCols}, ${this.uniqueLabels.length <= 5 ? 'uniqueLabels = [' + this.uniqueLabels.join(', ') + ']' : '#uniqueLabels = ' + this.uniqueLabels.length  }, #dataTrain = ${this.dataTrainCount}, #dataTest = ${this.dataTestCount}, r = ${this.r} }`;
  }
}

module.exports = {Classifier};
