const {readCSV} = require('./utils/data');
const {toTypedArray, transpose: t} = require('./utils');
const {mean, variance, mad, median, nQuart} = require('./utils/stats');
const {readdirSync} = require('fs');
const {shuffle} = require('./utils');
const {dirname, join} = require('path') ;

class DF {
  /**
   * @param {DF|Object<Array<*>>|Array<*>|Array<Array<*>>} data
   * @param {'cols'|'rows'|'dict'} [what]
   * @param {?Array<!String>} [colNames]
   */
  constructor(data = [], what = 'rows', colNames = null) {
    // accept data in 3 modes:
    // - list of columns Array<Array<*>>,
    // - list of rows <Array<Array<*>>,
    // - Object<*, Array<*>> (dict key => col)
    // - a DF (just clone it)
    if (data.length === 0) {
      this._cols = [];
      this.colNames = [];
    } else if (data.constructor.name === this.constructor.name) {
      this._cols = [].concat(data._cols);
      this.colNames = [].concat(data.colNames)
    } else if (data.constructor.name === 'Object' || what === 'dict') {
      this._cols = Object.values(data).map(toTypedArray);
      this.colNames = Object.keys(data);
    } else {
      this._cols = what === 'rows' ? t(data).map(toTypedArray) : data.map(toTypedArray);
      this.colNames  = colNames ? colNames : Array(this.nCols).fill(0).map((_, idx) => idx);
    }

    const attrNames = new Set(this.colNames);
    // index using cols integers AND column names
    Array(this.nCols).fill(0).map((_, idx) => attrNames.add(idx));

    // easy access e.g. df.age, df.salary
    for (const name of attrNames) {
      Object.defineProperty(this, name, { get: function () { return this.col(name); } });
    }

    function* iterator () {
      for (let r = 0; r < this.length; r++) {
        yield this.row(r);
      }
    }

    // make this.rowIter a getter
    Object.defineProperty(this, 'rowIter', {get: iterator});
    this[Symbol.iterator] = iterator;
  }

  /**
   * @param {!String} name
   * @return {!Number} column index
   * @private
   */
  _colNameToIdx(name) {
    return this.colNames.findIndex(c => c === name);
  }

  /**
   * @param {!String|!Number} nameOrIdx
   * @return {!Number} column index
   * @private
   */
  _resolveCol(nameOrIdx) {
    return nameOrIdx.constructor.name === 'String'
      ? this._colNameToIdx(nameOrIdx)
      : nameOrIdx;
  }

  /**
   * @param {!String|!Number} nameOrIdx
   * @return {Array<String>|TypedArray} column
   */
  col(nameOrIdx) {
    return this._cols[this._resolveCol(nameOrIdx)];
  }

  /**
   * @param {!Number} idx
   * @return {!Array<*>} row
   */
  row(idx) {
    return Array(this.nCols)
      .fill(0)
      .map((_, colIdx) => this.val(colIdx, idx));
  }

  /**
   * @return {!Number|!String} selects a val
   */
  val(col, idx) {
    return this.col(col)[idx];
  }

  /**
   * @param {!DF} other
   * @return {!DF} data frame
   */
  appendDF(other) {
    const cols = [].concat(this._cols);
    const colNames = [].concat(this.colNames);
    for (let c = 0; c < cols.length; c++) {
      if (cols[c].constructor.name === 'Array') {
        cols[c] = cols[c].concat(other.col(c));
      } else {
        const buf = new ArrayBuffer(cols[c].buffer.byteLength + other.col(c).buffer.byteLength);
        let view;
        if (other._cols[c].BYTES_PER_ELEMENT >= cols[c].BYTES_PER_ELEMENT) {
          view = new (other.col(c).constructor)(buf);
        } else {
          view = new (cols[c].constructor)(buf);
        }
        view.set(cols[c]);
        view.set(other.col(c), cols[c].length);
        cols[c] = view;
      }
    }
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!Array<!String>|!Array<!Number>} col
   * @param {?String} [colName]
   * @return {!DF} data frame
   */
  appendCol(col, colName = null) {
    const cols = [].concat(this._cols);
    const colNames = [].concat(this.colNames);
    cols.push(toTypedArray(col));
    colNames.push(colNames ? colNames : cols.length - 1);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!DF} other other data frame
   * @return {!DF} data frame
   */
  mergeDF(other) {
    const isDigit = /^\d+$/; // check if has proper column names or just indexes
    let colNames;

    // if columns are indexes, shift them
    if (other.colNames.filter(c => c.toString().match(isDigit)).length === other.colNames.length) {
      colNames = this.colNames.concat(other.colNames.map(cIdx => this.colNames.length + cIdx));
    } else {
      colNames = this.colNames.concat(other.colNames);
    }

    const cols = this._cols.concat(other._cols);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!Array<!Number|!String>} columns
   * @return {!DF} data frame
   */
  reorder(columns) {
    const cols = [];
    const colNames = [];
    for (const i of columns.map(this._resolveCol)) {
      cols.push(this._cols[i]);
      colNames.push(this.colNames[i]);
    }
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @return {!Number} number of rows
   */
  get length() {
    return this._cols[0].length;
  }

  /**
   * @return {!Number} number of columns
   */
  get nCols() {
    return this._cols.length;
  }

  /**
   * @return {{rows: !Number, cols: !Number}}
   */
  get dim() {
    return {rows: this.length, cols: this.nCols};
  }

  /**
   * @param {!Number|!String} col
   * @return {!String} data type for the column
   */
  dtype(col) {
    return this._cols[this._resolveCol(col)].constructor.name.replace('Array', '');
  }

  /**
   * @return {!Array<!String>} data types for all columns
   */
  get dtypes() {
    return this._cols.map(c => c.constructor.name.replace('Array', ''));
  }

  /**
   * @return {{total: !Number, cols: Object<!Number>}} memory info
   */
  get memory() {
    const memInfo = {
      total: this._cols
        .map(c =>
          c.constructor.name === 'Array'
            ? mean(c.map(s => s.length)) // assume 1 byte / char for string cols
            : c.byteLength)
        .reduce((v1, v2) => v1 + v2, 0), // sum
      cols: {},
    };
    for (let colName of this.colNames) {
      const colIdx = this._resolveCol(colName);
      if (this._cols[colIdx].constructor.name === 'Array') {
        memInfo.cols[colName] = mean(this._cols[colIdx].map(s => s.length));
      } else {
        memInfo.cols[colName] = this._cols[colIdx].byteLength;
      }
    }
    return memInfo;
  }

  /**
   * @return {!DF} data frame
   */
  get head() {
    return this.slice(0, 25);
  }

  /**
   * @return {!DF} data frame
   */
  get tail() {
    return this.slice(this.length - 25, this.length);
  }

  /**
   * @return {!DF} reversed version of the data frame
   */
  reversed(axis = 'cols') {
    if (axis === 'cols') {
      const cols = [].concat(this._cols).reverse();
      const colNames = [].concat(this.colNames).reverse();
      return new DF(cols, 'cols', colNames);
    }
    // reverse rows
    const cols = [];
    for (let c = 0; c < this.nCols; c++) {
      cols.push([].concat(this._cols[c]).reverse());
    }
    const colNames = [].concat(this.colNames);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!String|!Number} colA
   * @param {?String|?Number} colB
   * @return {!DF} data frame
   */
  sliceCols(colA, colB = null) {
    if (colB === null) return this.sliceCols(colA, this.nCols);
    const colAIdx = this._resolveCol(colA);
    const colBIdx = this._resolveCol(colB);
    return this.select(this.colNames.slice(colAIdx, colBIdx));
  }

  /**
   * @param {?Number} [n]
   * @param {?Number} [m]
   * @return {!DF} data frame
   */
  slice(n = null, m = null) {
    if (n === null) return this.slice(Math.min(25, process.stdout.rows - 1));
    else if (m === null) return this.slice(n, this.length);

    const cols = this._cols.map(c =>
      c.constructor.name === 'Array'
        ? c.slice(n, m)
        : c.subarray(n, m));

    return new DF(cols, 'cols', [].concat(this.colNames));
  }

  /**
   * @param {!Array<!Number|!String>} colNames
   * @return {!DF} data frame
   */
  select(colNames) {
    const colIdxs = colNames.map(this._resolveCol);
    const cols = this._cols.filter((_c, idx) => colIdxs.indexOf(idx) >= 0);
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!String|!Number} nameOrIdx
   * @return {!DF} data frame
   */
  dropCol(nameOrIdx) {
    const colIdx = this._resolveCol(nameOrIdx);
    const cols = this._cols.slice(0, colIdx).concat(this._cols.slice(colIdx + 1));
    const colNames = this.colNames.slice(0, colIdx).concat(this._cols.slice(colIdx + 1));
    return new DF(cols, 'cols', colNames);
  }

  /**
   * @param {!Function} f predicate (row => Boolean)
   * @return {!DF} data frame
   */
  filter(f = (_row, _idx) => true) {
    return new DF(
      Array.from(this.rowIter).filter(f),
      'rows',
      this.colNames,
    );
  }

  /**
   * Shuffle the data frame.
   *
   * @return {!DF} data frame with shuffled rows
   */
  shuffle() {
    const rows = Array.from(this.rowIter);
    shuffle(rows);
    return new DF(rows, 'rows', this.colNames);
  }

  /**
   * Summaries each column.
   *
   * @return {DF} data frame
   */
  get summary() {
    const info = {
      column: [],
      min: [], max: [], range: [],
      mean: [],
      stdev: [], variance: [], mad: [],
      Q1: [], median: [], Q3: [],
      dtype: [],
    };
    for (let c = 0; c < this.nCols; c++) {
      const dtype = this.dtypes[c];
      const name = this.colNames[c];
      if (dtype === 'String') {
        for (const k in info) info[k].push('nan');
        info.column[info.column.length - 1] = name;
        info.dtype[info.dtype.length - 1] = dtype;
        continue
      }
      const col = this._cols[c];
      const min = col.reduce((v1, v2) => Math.min(v1, v2));
      const max = col.reduce((v1, v2) => Math.max(v1, v2));
      const v = variance(col);
      info.column.push(name);
      info.mean.push(mean(col));
      info.dtype.push(dtype);
      info.variance.push(v);
      info.stdev.push(Math.sqrt(v));
      info.Q1.push(nQuart(col, 1, 4));
      info.median.push(median(col));
      info.Q3.push(nQuart(col, 3, 4));
      info.min.push(min);
      info.max.push(max);
      info.mad.push(mad(col));
      info.range.push(max - min);
    }
    return new DF(info);
  }

  /**
   * @return {!Object<Array<!Number>|!Array<!String>>} dictionary
   */
  toDict() {
    const dict = {};
    for (let c = 0; c < this.nCols; c++) {
      dict[this.colNames[c]] = Array.from(this._cols[c]);
    }
    return dict;
  }

  /**
   * @return {!Array<Array<*>>} rows or cols as array
   */
  toArray(mode = 'rows') {
    return mode === 'rows'
      ? Array.from(this.rowIter)
      : this._cols.map(c => Array.from(c));
  }

  /**
   * @param {?Number} [n]
   * @param {?Number} [m]
   */
  print(n = null, m = null) {
    if (n === null) return this.print(Math.min(25, process.stdout.rows - 1));
    else if (m === null) return this.print(0, n);
    const table = Array.from(this.rowIter)
      .splice(n, m)
      .map(row => {
        const dict = {};
        for (let v = 0; v < row.length; v++) {
          dict[this.colNames[v]] = row[v];
        }
        return dict;
      });
    console.table(table);
  }

  /**
   * @param {!String} filePath
   * @param {?Boolean} [hasHeader]
   * @param {?Array<!String>} colNames
   * @return {!DF} data frame
   */
  static fromCSV(filePath, hasHeader = true, colNames = null) {
    const rows = readCSV(filePath, false); // assume for now it doesn't
    const maybeHeader = hasHeader ? rows[0] : null;
    const cols = t(hasHeader ? rows.splice(1) : rows);
    const isNum = /^(\d+\.?\d*|\d*\.\d+)$/g;
    for (let c = 0; c < cols.length; c++) {
      if (!cols[c].find(val => !val.match(isNum))) {
        cols[c] = cols[c].map(parseFloat)
      }
    }
    return new DF(cols, 'cols', maybeHeader);
  }

  static loadDataSet(name = 'iris', hasHeader = true, colNames = null) {
    return DF.fromCSV(`${dirname(__filename)}/datasets/${name}/${name}.csv`, hasHeader, colNames);
  }

  static get dataSetsPath() {
    return join(dirname(__filename), 'datasets');
  }

  static get dataSets() {
    return readdirSync(DF.dataSetsPath).filter(node => !node.match(/\.w+$/));
  }

  toString() {
    return `${this.constructor.name} ${this.nCols}x${this.length} { ${this.dtypes.map((dt, idx) => `${this.colNames[idx]}  ${dt}`).join(', ')} }`;
  }
}

module.exports = DF;
