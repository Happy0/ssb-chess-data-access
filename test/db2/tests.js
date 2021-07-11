const test = require('tape');
const ssbKeys = require('ssb-keys');
const SbotBrowserCore = require('../../lib/index').SbotBrowserCore;
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const path = require('path')

const testDbDir = '/tmp/ssb-chess-data-access-db2'

const BrowserCore = require('ssb-browser-core/core');
const pull = require('pull-stream');

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
        const invite = {
            "type": "chess_invite",
            "inviting": "@NeB4q4Hy9IiMxs5L08oevEhivxW+/aDu/s/0SkNayi0=.ed25519",
            "myColor": "black",
            "branch": [
              "%5cYKNR0PEz793N1Rtli93IcuGDZHsHDu+06Ii+OEIPw=.sha256",
              "%vcNed83YdIA0mF0H/w5NFyy1Z/PazyomsWVhzWDnru8=.sha256",
              "%+pVoEqGX3tYSKbCpvEa7oto2NvPxR1/UAIv+i+cUPRA=.sha256",
              "%01ksKwoAAkrY+bjYdP1WCgtZHHGGcZ8bXmEoYnUlyn4=.sha256",
              "%9oK3ltfnvH9/7h5sxD6Cu+IYoSXcOddTMPJ5L6dLsUM=.sha256",
              "%ldUBk14tkOXNoLECOP9BYDyCyBh4p9KvfHAIzpwcK9k=.sha256"
            ]
          };

        dataAccess.publishPublicChessMessage(invite, (err) => {
            t.equals(err, null, "There should be no error on publishing");
            
            const myIdent = `@${keys.public}`
            console.log("me: " + myIdent)
            const messagesSource = dataAccess.chessMessagesForPlayerGames(myIdent, {live: false});
    
            pull(messagesSource, pull.collect((err, results) => {
                t.equals(err, null, "There should be no errors when finding user messages");
                t.equals(results.length, 1, "There should be one message in the feed")
                t.end();
            }))
        })
    });

    test('publishPrivateChessMessage', (t) => {

        const invite = {
            "type": "chess_invite",
            "inviting": "@NeB4q4Hy9IiMxs5L08oevEhivxW+/aDu/s/0SkNayi0=.ed25519",
            "myColor": "black",
            "branch": [
              "%5cYKNR0PEz793N1Rtli93IcuGDZHsHDu+06Ii+OEIPw=.sha256",
              "%vcNed83YdIA0mF0H/w5NFyy1Z/PazyomsWVhzWDnru8=.sha256",
              "%+pVoEqGX3tYSKbCpvEa7oto2NvPxR1/UAIv+i+cUPRA=.sha256",
              "%01ksKwoAAkrY+bjYdP1WCgtZHHGGcZ8bXmEoYnUlyn4=.sha256",
              "%9oK3ltfnvH9/7h5sxD6Cu+IYoSXcOddTMPJ5L6dLsUM=.sha256",
              "%ldUBk14tkOXNoLECOP9BYDyCyBh4p9KvfHAIzpwcK9k=.sha256"
            ]
          };

        dataAccess.publishPublicChessMessage(invite, (err, result) => {
            const gameId = result.key;

            const message = {
                "root": gameId,
                "type": "chess_chat",
                "msg": "testaroonie"
            };
    
            dataAccess.publishPrivateChessMessage(message, [`@${keys.public}`], (err, result) => {
                t.equals(err, null, "Private message should be published successfully");

                // Should be an encrypted payload
                t.assert(typeof(result.value.content) === "string");
    
                pull(dataAccess.allGameMessages(gameId, false), pull.collect((err, data) => {
                    t.equals(data.length, 2, "There should be two messages associated with the game ID");

                    // Should be decryptable because we included ourselves in the recipients
                    t.equals(data[1].value.content.msg, "testaroonie")

                    t.end();
                }))
            })
        })
    });

    test("allGameMessages (non-live)", (t) => {
        const player1 = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'secret2'));
        const player2 = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'secret3'));

        //WIP
        
        t.end();




    });

}, 2000);

