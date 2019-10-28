/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('bsert');
const {tmpdir} = require('os');
const Path = require('path');
const fs = require('../lib/fs');
const native_fs = require('fs');
const Logger = require('../lib/logger');

async function tempFile(name) {
  const time = Date.now();
  const dir = Path.join(tmpdir(), `blgr-test-${time}`);
  await fs.mkdir(dir);
  return Path.join(dir, `${name}.log`);
};

describe('Logger', function() {
  describe('log', function() {
    let logger = null;
    const msg = 'Test.';

    it('not log (level)', async () => {
      logger = new Logger({level: 'none'});
      await logger.open();

      let writeConsole = 0;
      let writeStream = 0;

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.ERROR, 'module', [msg]);
      logger.log(Logger.levels.WARNING, 'module', [msg]);
      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.SPAM, 'module', [msg]);

      assert.equal(writeConsole, 0);
      assert.equal(writeStream, 0);
    });

    it('not log (not open)', async () => {
      logger = new Logger({level: 'spam'});

      let writeConsole = 0;
      let writeStream = 0;

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.ERROR, 'module', [msg]);
      logger.log(Logger.levels.WARNING, 'module', [msg]);
      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.SPAM, 'module', [msg]);

      assert.equal(writeConsole, 0);
      assert.equal(writeStream, 0);
    });

    it('log error', async () => {
      logger = new Logger({level: 'error'});
      await logger.open();

      let writeConsole = 0;
      let writeStream = 0;

      assert.equal(logger.level, Logger.levels.ERROR);

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.WARNING, 'module', [msg]);
      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.SPAM, 'module', [msg]);

      assert.equal(writeConsole, 0);
      assert.equal(writeStream, 0);

      logger.log(Logger.levels.ERROR, 'module', [msg]);

      assert.equal(writeConsole, 1);
      assert.equal(writeStream, 1);
    });

    it('log error and warning', async () => {
      logger = new Logger({level: 'warning'});
      await logger.open();

      let writeConsole = 0;
      let writeStream = 0;

      assert.equal(logger.level, Logger.levels.WARNING);

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.SPAM, 'module', [msg]);
      assert.equal(writeConsole, 0);
      assert.equal(writeStream, 0);

      logger.log(Logger.levels.ERROR, 'module', [msg]);
      logger.log(Logger.levels.WARNING, 'module', [msg]);
      assert.equal(writeConsole, 2);
      assert.equal(writeStream, 2);
    });

    it('log error, warning and info', async () => {
      logger = new Logger({level: 'info'});
      await logger.open();

      let writeConsole = 0;
      let writeStream = 0;

      assert.equal(logger.level, Logger.levels.INFO);

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.SPAM, 'module', [msg]);
      assert.equal(writeConsole, 0);
      assert.equal(writeStream, 0);

      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.ERROR, 'module', [msg]);
      logger.log(Logger.levels.WARNING, 'module', [msg]);
      assert.equal(writeConsole, 3);
      assert.equal(writeStream, 3);
    });

    it('log error, warning, info, debug', async () => {
      logger = new Logger({level: 'debug'});
      await logger.open();

      let writeConsole = 0;
      let writeStream = 0;

      assert.equal(logger.level, Logger.levels.DEBUG);

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.SPAM, 'module', [msg]);
      assert.equal(writeConsole, 0);
      assert.equal(writeStream, 0);

      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.ERROR, 'module', [msg]);
      logger.log(Logger.levels.WARNING, 'module', [msg]);
      assert.equal(writeConsole, 4);
      assert.equal(writeStream, 4);
    });

    it('log error, warning, info, debug, spam', async () => {
      logger = new Logger({level: 'spam'});
      await logger.open();

      let writeConsole = 0;
      let writeStream = 0;

      assert.equal(logger.level, Logger.levels.SPAM);

      logger.writeConsole = () => writeConsole += 1;
      logger.writeStream = () => writeStream += 1;

      logger.log(Logger.levels.DEBUG, 'module', [msg]);
      logger.log(Logger.levels.SPAM, 'module', [msg]);
      logger.log(Logger.levels.INFO, 'module', [msg]);
      logger.log(Logger.levels.ERROR, 'module', [msg]);
      logger.log(Logger.levels.WARNING, 'module', [msg]);
      assert.equal(writeConsole, 5);
      assert.equal(writeStream, 5);
    });
  });

  describe('logError', function() {
    let logger, log, called = null;
    const err = new Error('Test.');

    before(async () => {
      logger = new Logger();
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

    it('should log stack with error() level', async () => {
      logger.logError(Logger.levels.ERROR, 'module', err);
      assert.equal(called.level, Logger.levels.ERROR);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], false, true);
    });

    it('should log stack with warning() level', async () => {
      logger.logError(Logger.levels.WARNING, 'module', err);
      assert.equal(called.level, Logger.levels.WARNING);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, true);
    });

    it('should not log stack with info() level', async () => {
      logger.logError(Logger.levels.INFO, 'module', err);
      assert.equal(called.level, Logger.levels.INFO);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, false);
    });

    it('should not log stack with debug() level', async () => {
      logger.logError(Logger.levels.DEBUG, 'module', err);
      assert.equal(called.level, Logger.levels.DEBUG);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, false);
    });

    it('should not log stack with spam() level', async () => {
      logger.logError(Logger.levels.SPAM, 'module', err);
      assert.equal(called.level, Logger.levels.SPAM);
      assert.equal(called.args.length, 1);
      checkMsg(called.args[0], true, false);
    });
  });

 describe('File rotation', function() {
    let filename;
    let logger;

    before(async () => {
      filename = await tempFile('file-size');

      logger = new Logger({
        level: 'spam',
        filename: filename,
        console: false
      });
      await logger.open();
    });

    after(async () => {
      if (!logger.closed)
        await logger.close();
    });

    it('should get current log file size', async () => {
      assert.strictEqual(logger._fileSize, 0);

      let perLine = 0;
      perLine += '[D:2019-10-21T19:58:44Z] '.length; // timestamp
      perLine += 1;                                  // \n end of every line
      perLine += 1000;                               // the "message"

      const lines = 1000;
      for (let i = 0; i < lines; i++) {
        // 500 bytes = 1000 char hex = 1000 bytes written to log file
        logger.debug(Buffer.alloc(500).toString('hex'));

        // Keep track of size during operation
        assert.strictEqual(logger._fileSize, (i + 1) * perLine);
      }

      // Reset
      await logger.close();
      assert.strictEqual(logger._fileSize, 0);

      // Get file size on reopen
      await logger.open();
      assert.strictEqual(logger._fileSize, perLine * lines);
    });

    it('should rotate out log file', async () => {
      const rename = await logger.rotate();
      assert(native_fs.existsSync(rename));
      assert(native_fs.existsSync(logger.filename));

      assert.strictEqual(logger._fileSize, 0);

      const stat = native_fs.statSync(logger.filename);
      assert.strictEqual(stat.size, 0);
    });
  });
});
