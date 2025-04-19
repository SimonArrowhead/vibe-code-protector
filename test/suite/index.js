const path = require('path');
const { runTests } = require('vscode-test');

async function main() {
    try {
        console.log('Running tests...');
        await runTests({ 
            version: 'stable', 
            extensionDevelopmentPath: path.resolve(__dirname, '../../'), 
            extensionTestsPath: path.resolve(__dirname, './extension.test.js') 
        });
    } catch (err) {
        console.error('Failed to run tests');
        console.error(err);
        process.exit(1);
    }
}

main();