const test = require('tape');
const ssbKeys = require('ssb-keys');
const SbotBrowserCore = require('../../lib/index').SbotBrowserCore;
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const path = require('path')
const validate = require('ssb-validate');

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

        let s = validate.initial()

        const gameMessages = require('./data/example_game.json');
        const author1 = "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519";

        const inviteMsg = gameMessages[0].value.content;

        const time = Date.now();
        
        s = validate.appendNew(s, null, player1, inviteMsg, time);

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => SSB.db.add(kvt.value, cb)),
            pull.collect((err, msgs) => {
                t.error(err, "There shouldn't be an error when creating test data");
                t.equals(msgs.length, 1, "There should be one message");

                const gameId = msgs[0].key;
                
                const restOfGameMessages = gameMessages.slice(1);
                restOfGameMessages.forEach((msg, index) => {
                    const playerKey = msg.value.author === author1 ? player1 : player2;

                    const content = msg.value.content;

                    // Set the gameID to the newly auto-generated one
                    msg.value.content.root = gameId;

                    s = validate.appendNew(s, null, playerKey, content, time + index + 1);
                });

                const db = SSB.db;
               // console.log(db)

                pull(
                    pull.values(s.queue),
                    pull.asyncMap((kvt, cb) => {
                     // console.log(kvt);

                        db.addOOO(kvt.value, cb)
                    }),
                    pull.collect((err, results)=> {
                        t.error(err);

                        db.onDrain(() => {
                            const allGameMessages = dataAccess.allGameMessages(gameId, false);

                            pull(allGameMessages, pull.collect((err, msgs) => {

                                const expectedMessagesContent = gameMessages.map(e => e.value.content);
                                const actualMessagesContent = msgs.map(e => e.value.content);

                                
                                t.deepEqual(actualMessagesContent, expectedMessagesContent, "Game messages should be in expected order");


                                t.end();
                            }))


                        })

                    })
                )


      

            })
        );




        

       





        //WIP... Load messages from example_game.json 





    });

    test("allGameMessages (live)", (t) => {
        t.end();

    });




}, 2000);

