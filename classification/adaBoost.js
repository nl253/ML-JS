const {majorityVote} = require('../utils');
const log = require('../utils/log');
const {Classifier} = require('./index');
const Tree = require('./extraTree');
const NB = require('../classification/naiveBayes');

class AdaBoost extends Classifier {

  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [bias]
   * @param {?Array<!Function>|"bayes"|"trees"} [classifiers]
   * @param {?Number} [n]
   */
  constructor(data, labels, r = 0.1, classifiers = null, n = null, bias = 1) {
    super(data, labels, r);
    if (classifiers === null || classifiers === 'bayes') {
      this.classifiers = Array(n || 10).fill(0).map(_ => ((data, labels, r) => new NB(data, labels, r)));
    } else if (classifiers === 'trees') {
      this.classifiers = Array(n || 5).fill(0).map(_ => ((data, labels, r) => new Tree(data, labels, r)));
    } else this.classifiers = classifiers;
    this.bias = bias;
    this._dataTrainCache = this.dataTrain;
  }

  fit() {
    // FIXME fixed-sized arrays (won't work)
    for (let c = 0; c < this.classifiers.length; c++) {
      const model = this.classifiers[c](this._dataTrainCache, this.labelsTrain, this.r);
      log.info(`training ${model.constructor.name} [${c}/${this.classifiers.length}]`);
      model.fit();
      const dataCount = this._dataTrainCache.length;
      for (let row = 0; row < dataCount; row++) {
        if (model.predict(this._dataTrainCache.row(row)) !== this.labelsTrain[row]) {
          log.debug(`boosting example #${row} x${this.bias}`);
          for (let b = 0; b < this.bias; b++) {
            // this.push(this._dataTrainCache.row(row));
            this.labels.push(this.labelsTrain[row]);
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
    return `${this.constructor.name} { ${this.classifiers[0].constructor.name !== 'Function' ? 'acc = ' + this.score + ' ' : ''}classifiers = ${classifierInfo} }`;
  }
}

module.exports = AdaBoost;
