/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('bsert');
const {tmpdir} = require('os');
const Path = require('path');
const fs = require('../lib/fs');
const Logger = require('../lib/logger');

async function tempFile(name) {
  const time = Date.now();
  const dir = Path.join(tmpdir(), `blgr-test-${time}`);
  await fs.mkdir(dir);
  return Path.join(dir, `${name}.log`);
};

// Prints specified number of 1000-character lines to file.
// Returns total increase to file size in bytes.
function logLines(logger, lines) {
  let perLine = 0;
  perLine += '[D:2019-10-21T19:58:44Z] '.length; // timestamp
  perLine += 1;                                  // \n end of every line
  perLine += 14;                                 // Date.now() plus space
  perLine += 1000;                               // 500 byte Buffer.toString()

  for (let i = 0; i < lines; i++) {
    logger.debug(
      Date.now().toString()
      + ' '
      + Buffer.alloc(500).toString('hex')
    );
  }
  return perLine * lines;
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
    this.timeout(5000);
    let filename;
    let logger;

    beforeEach(async () => {
      filename = await tempFile('file-size');

      logger = new Logger({
        level: 'spam',
        filename: filename,
        console: false
      });
      await logger.open();
    });

    afterEach(async () => {
      if (!logger.closed)
        await logger.close();
    });

    it('should get current log file size', async () => {
      assert.strictEqual(logger._fileSize, 0);

      const bytes = logLines(logger, 1000);
      assert.strictEqual(logger._fileSize, bytes);

      // Reset
      await logger.close();
      assert.strictEqual(logger._fileSize, 0);

      // Get file size on reopen
      await logger.open();
      assert.strictEqual(logger._fileSize, bytes);
    });

    it('should rotate out log file', async () => {
      // Write some junk
      const bytes = logLines(logger, 100);

      // Move current log file to archive file
      const rename = await logger.rotate();
      assert(await fs.stat(rename));
      assert(await fs.stat(logger.filename));

      // Archive file should have the junk
      const stat1 = await fs.stat(rename);
      assert.strictEqual(stat1.size, bytes);

      // Internal file size property should be reset
      assert.strictEqual(logger._fileSize, 0);

      // New log file should be empty
      const stat2 = await fs.stat(logger.filename);
      assert.strictEqual(stat2.size, 0);
    });

    it('should rotate out log files when limit is reached', async () => {
      logger.maxFileSize = 1 << 18; // ~260kB
      logger.maxFiles = 100; // effectively disable pruning

      let bytes = 0;
      for (let i = 0; i < 1000; i++) {
        bytes += logLines(logger, 1);
        // In practice, we wouldn't be logging thousands of lines in a
        // single operation. Slow down the test loop so that writeStream()
        // has a chance to flush to disk and rotate the file out.
        await new Promise(r => setTimeout(r, 0));
      }

      await logger.close();

      // Should be 4 files about 260kB each
      const dir = Path.dirname(logger.filename);
      const files = await fs.readdir(dir);
      assert.strictEqual(files.length, 4);

      // With the write loop slowed down, every single byte should be written.
      let actual = 0;
      for (const file of files) {
        const path = Path.join(dir, file);
        const stat = await fs.stat(path);
        actual += stat.size;
      }
      assert.strictEqual(bytes, actual);
    });

    it('should prune old log files', async () => {
      logger.maxFileSize = 1 << 18; // ~260kB
      logger.maxFiles = 4;

      for (let i = 0; i < 2000; i++) {
        logLines(logger, 1);
        await new Promise(r => setTimeout(r, 0));
      }

      await logger.close();

      // 2000 lines of 1000 bytes = 2,000,000 bytes.
      // With a max file size of ~130k, that should produce 8 files.
      // After pruning, only 4 archival + 1 current file should remain.
      const dir = Path.dirname(logger.filename);
      const files = await fs.readdir(dir);
      assert.strictEqual(files.length, 5);
    });
  });
});
