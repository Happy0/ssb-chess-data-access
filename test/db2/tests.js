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
    const dataAccess = new SbotBrowserCore(SSB);

    test('whoAmI', (t) => {

        dataAccess.whoAmI((err, id) => {
            t.assert(err == undefined, `Err should be undefined"`)
            t.equals(id.id, `@${keys.public}`, "Should have expected public key")
            t.end()
        })
    });

    test('publishPublicChessMessage', (t) => {
        const move = {
            "type": "chess_move",
            "ply": 21,
            "root": "%l3v+aYB+hevqsU1ei4XnNNzJWbLgz3y/g8SQxx+gcMA=.sha256",
            "orig": "f1",
            "dest": "e1",
            "pgnMove": "Rfe1",
            "fen": "2kr3r/ppp1q1pp/2n1bn2/2bp1p2/8/1PNP1N2/PBPQBPPP/R3R1K1 b - - 8 11",
            "branch": "%Lmu7YVWzwebVsXtGwW+SplWUTf8LcVljKgBtaHC3yD8=.sha256"
        };

        dataAccess.publishPublicChessMessage(move, (err) => {
            t.equals(err, null, "Should not result in error");
            const { author, where, descending, toCallback } = SSB.dbOperators;

            SSB.db.query(
                where(
                    author(`@${keys.public}`)
                ),
                descending(),
                toCallback((err, msgs) => {
                    t.assert(msgs.length, 1, "There should only be one message in the user's feed");

                    t.end();
                })
                
            )
        });

    })



}, 2000);

