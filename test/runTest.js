const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');

function run() {
  const mocha = new Mocha({
    ui: 'bdd',
    color: true
  });

  const testFiles = glob.sync('**/*.test.js', { cwd: path.join(__dirname, 'suite') });
  testFiles.forEach(file => mocha.addFile(path.join(__dirname, 'suite', file)));

  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}

run();