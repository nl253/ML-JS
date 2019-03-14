const {majorityVote} = require('../utils');
const log = require('../utils/log');
const {Classifier} = require('./index');
const Tree = require('../classification/randTree');

class AdaBoost extends Classifier {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [bias]
   * @param {!Array<!Function>} [classifiers]
   */
  constructor(
    data,
    labels,
    r = 0.1,
    bias = 1,
    classifiers = Array(100).fill(0).map(_ => ((data, labels, r) => new Tree(data, labels, r)))) {
    super(data, labels, r);
    this.classifiers = classifiers;
    this.bias = bias;
  }

  fit() {
    for (let c = 0; c < this.classifiers.length; c++) {
      const model = this.classifiers[c](this.data, this.labels, this.r);
      log.info(`training ${model.constructor.name} [${c}/${this.classifiers.length}]`);
      model.fit();
      const dataCount = this.dataTrain.length;
      for (let row = 0; row < dataCount; row++) {
        if (model.predict(this.dataTrain[row]) !== this.labelsTrain[row]) {
          log.debug(`boosting example #${row} x${this.bias}`);
          for (let b = 0; b < this.bias; b++) {
            this.dataTrain.push(this.dataTrain[row]);
            this.labelsTrain.push(this.labelsTrain[row]);
          }
        }
      }
      log.info(`finished training ${model.toString()}`);
      this.classifiers[c] = model;
    }
  }

  predict(x) {
    return majorityVote(this.classifiers.map(c => c.predict(x)));
  }

  toString() {
    const index = {};
    for (let c = 0; c < this.classifiers.length; c++) {
      index[this.classifiers[c].constructor.name] = (index[this.classifiers[c].constructor.name] || 0) + 1;
    }
    let classifierInfo = Object.entries(index).map(([name, count]) => count > 1 ? name + 'x' + count: name).join(', ');
    return `${this.constructor.name} { acc = ${this.score()}, classifiers = ${classifierInfo} }`;
    // return '';
  }
}

module.exports = AdaBoost;
