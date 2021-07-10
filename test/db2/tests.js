const test = require('tape');
const ssbKeys = require('ssb-keys');
const SbotBrowserCore = require('../../lib/index').SbotBrowserCore;
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const path = require('path')

const testDbDir = '/tmp/ssb-chess-data-access-db2'

const BrowserCore = require('ssb-browser-core/core');

rimraf.sync(testDbDir);
mkdirp.sync(testDbDir);

const keys = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'secret'))

const config = {
    keys: keys
}

BrowserCore.init(testDbDir, config)

// For some reason the ssb modules can take a little while to load
setTimeout(() => {

    test('whoAmI', (t) => {
        const dataAccess = new SbotBrowserCore(SSB);

        dataAccess.whoAmI((err, id) => {
            t.assert(err == undefined, `Err should be undefined. Is: ${id}`)
            t.equals(id.id, `@${keys.public}`)
            t.end()
        })
    })

}, 2000);

