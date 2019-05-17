/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('bsert');
const Logger = require('../lib/logger');

describe('Logger', function() {
  describe('logError', function() {
    let logger, log, called = null;
    const err = new Error('Test.');

    before(async () => {
      logger = new Logger({level: 'debug'});
      log = logger.log;
      await logger.open();
    });

    beforeEach(() => {
      logger.log = (level, module, args) => {
        called = {level, module, args};
      };
    });

    afterEach(() => {
      logger.log = log;
    });

    function checkMsg(msg, error, stack) {
      const lines = msg.split('\n');
      if (stack)
        assert.equal(lines.length, 11);
      else
        assert.equal(lines.length, 1);

      const lead = /Error\:/.test(lines[0]);
      const message = /Test\./.test(lines[0]);

      if (error)
        assert(lead, 'Should not strip "Error".');
      else
        assert(!lead, 'Should strip "Error: ".');

      assert(message);
    }

    it('should log stack with ERROR level', async () => {
      logger.logError(Logger.levels.ERROR, 'module', err);
      assert.equal(called.level, Logger.levels.ERROR);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], false, true);
    });

    it('should log stack with WARNING level', async () => {
      logger.logError(Logger.levels.WARNING, 'module', err);
      assert.equal(called.level, Logger.levels.WARNING);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, true);
    });

    it('should not log stack with INFO level', async () => {
      logger.logError(Logger.levels.INFO, 'module', err);
      assert.equal(called.level, Logger.levels.INFO);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, false);
    });

    it('should not log stack with DEBUG level', async () => {
      logger.logError(Logger.levels.DEBUG, 'module', err);
      assert.equal(called.level, Logger.levels.DEBUG);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, false);
    });

    it('should not log stack with SPAM level', async () => {
      logger.logError(Logger.levels.SPAM, 'module', err);
      assert.equal(called.level, Logger.levels.SPAM);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, false);
    });
  });
});
