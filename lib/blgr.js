/*!
 * blgr.js - basic logger for bcoin
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

const Logger = require('./logger');

function blgr(options) {
  return new Logger(options);
}

blgr.logger = blgr;
blgr.Logger = Logger;
blgr.global = Logger.global;

module.exports = blgr;
