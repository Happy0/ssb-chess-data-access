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
const { init } = require('ssb-browser-core/net');

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

        const makeIrrelevantMessages = () => {
            const msg = {
                "value": {
                    "author": "@weejimmy",
                    "content": {
                        "type": "post",
                        "msg": "Wit youse aw sayin' tae it?"
                    }
                }
            }

            const msg2 =  {
                "value": {
                    "author": "@fulano",
                    "content": {
                        "type": "post",
                        "msg": "Quien quiere echar el chal conmigo?"
                    }
                }
            }

            return [msg, msg2];
        }

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => SSB.db.add(kvt.value, cb)),
            pull.collect((err, msgs) => {
                t.error(err, "There shouldn't be an error when creating test data");
                t.equals(msgs.length, 1, "There should be one message");

                const gameId = msgs[0].key;
                
                const restOfGameMessages = gameMessages.slice(1);

                const irrelevantMessages = makeIrrelevantMessages();

                restOfGameMessages.concat(irrelevantMessages).forEach((msg, index) => {
                    const playerKey = msg.value.author === author1 ? player1 : player2;

                    const content = msg.value.content;

                    if (msg.value.content.type != "post") {
                        // Set the gameID to the newly auto-generated one so it links back
                        msg.value.content.root = gameId;
                    }

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
    });

    test("allGameMessages (live)", (t) => {
        const db = SSB.db;

        const player1 = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'secret4'));
        const player2 = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'secret5'));

        let s = validate.initial()

        const gameMessages = require('./data/example_game.json');
        const author1 = "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519";

        const inviteMsg = gameMessages[0].value.content;

        const time = Date.now();
        
        s = validate.appendNew(s, null, player1, inviteMsg, time);

        const makeIrrelevantMessages = () => {
            const msg = {
                "value": {
                    "author": "@weejimmy",
                    "content": {
                        "type": "post",
                        "msg": "Wit youse aw sayin' tae it?"
                    }
                }
            }

            const msg2 =  {
                "value": {
                    "author": "@fulano",
                    "content": {
                        "type": "post",
                        "msg": "Quien quiere echar el chal conmigo?"
                    }
                }
            }

            return [msg, msg2];
        }

        const appendMessages = (s, messages, gameId) => {

            messages.forEach((msg, index) => {
                const playerKey = msg.value.author === author1 ? player1 : player2;

                const content = msg.value.content;

                if (msg.value.content.type != "post") {
                    // Set the gameID to the newly auto-generated one so it links back
                    msg.value.content.root = gameId;
                }

                s = validate.appendNew(s, null, playerKey, content, time + index + 1);
            });
        }

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => SSB.db.add(kvt.value, cb)),
            pull.collect((err, msgs) => {
                t.error(err, "There shouldn't be an error when creating test data");
                t.equals(msgs.length, 1, "There should be one message");
                const gameId = msgs[0].key;
                const restOfGameMessages = gameMessages.slice(1);

                const initial = restOfGameMessages.slice(0, 4);
                appendMessages(s, initial, gameId);

                pull(
                    pull.values(s.queue),
                    pull.asyncMap((kvt, cb) => {
                        db.addOOO(kvt.value, cb)
                    }),
                    pull.collect((err, results)=> {
                        db.onDrain(() => {
                            // These are the messages that will arrive after the initial database drain
                            const liveMessages = restOfGameMessages.slice(4);

                            const allGameMessages = dataAccess.allGameMessages(gameId, true);

                            // Because this stream is live, we end it after the expected 51 messages arrived (game messages + 'sync' messages.)
                            pull(allGameMessages, pull.take(51), pull.collect((err, msgs) => {
                                const expectedSyncPosition = msgs[5];

                                // The messages after 'sync' are the live ones
                                t.deepEqual(expectedSyncPosition, {sync: true});

            
                                const expectedMessagesContent = gameMessages.map(e => e.value.content);
                                const actualMessagesContent = msgs.filter(e => !e.sync).map(e => e.value.content);
            
                                t.deepEqual(actualMessagesContent, expectedMessagesContent, "Game messages should be in expected order");
            
                                t.end();
                            }));
            
                            const irrelevantMessages = makeIrrelevantMessages();
                            const rest = liveMessages.concat(irrelevantMessages);
            
                            appendMessages(s, rest, gameId);
            
                            pull(
                                pull.values(s.queue),
                                pull.asyncMap((kvt, cb) => {
                                    db.addOOO(kvt.value, cb)
                                }),
                                pull.collect((err, results)=> {
                                    if (err) {
                                        t.error(err);
                                    }
                                })
                            )
                        })


                    })
                )

            })
        );

    });

    test("chessInviteMessages (non-live)", (t) => {

        const db = SSB.db;
        const time = Date.now();

        const exampleStatuses = require('./data/example_statuses.json');
        const firstTen = exampleStatuses.slice(0,10);

        let s = validate.initial();

        const keys = [];

        firstTen.forEach(
            (msg, index) => {
                const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'invite_messages_key' + index));
                keys.push(`@${playerKey.public}`)

                s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
            }
        );

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => {
                db.addOOO(kvt.value, cb)
            }),
            pull.collect((err, results)=> {
              //  console.log(results.map(e => e.value.content))
                if (err) {
                    t.error(err);
                }

                db.onDrain(() => {
                    const source = dataAccess.chessInviteMessages(false);

                    // I haven't found a way to delete DB and start again so doing this for now
                    const fromTestOnly = pull.filter(msg => keys.indexOf(msg.value.author) !== -1);

                    pull(source, fromTestOnly, pull.collect(
                        (err, results) => {
                            console.log(err)

                            t.equals(results.length, 4, "there should be 4 invites");

                            t.end();
                        }
                    ));
                })
            })
        )
    });

    test("chessInviteMessages (live)", (t) => {
        const db = SSB.db;
        const time = Date.now();
        const exampleStatuses = require('./data/example_statuses.json');
        let s = validate.initial();
        const keys = [];

        const nonLive = exampleStatuses.slice(0,3);
        const lives = exampleStatuses.slice(3,10);

        nonLive.forEach(
            (msg, index) => {
                const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'live_invite_messages_key' + index));
                keys.push(`@${playerKey.public}`)

                s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
            }
        );

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => {
                db.addOOO(kvt.value, cb)
            }),
            pull.collect((err, result) => {
                db.onDrain(() => {

                    const source = dataAccess.chessInviteMessages(true);

                    const fromTestOnly = pull.filter(msg => msg.sync || keys.indexOf(msg.value.author) !== -1); 

                    pull(source, fromTestOnly, pull.take(5), pull.collect((err, results) => {
                        console.log(results)
                        const withoutSync = results.filter(e => !e.sync);

                        t.assert(results.find(e => e.sync) != null); 

                        t.assert(results[2].sync == true);

                        t.deepEqual(withoutSync.length, 4, "There should be 4 invite messages");

                        t.end();
                    }));

                    lives.forEach(
                        (msg, index) => {
                            const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'live_invite_messages_key' + index));
                            keys.push(`@${playerKey.public}`)
            
                            s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
                        }
                    );

                    pull(
                        pull.values(s.queue),
                        pull.asyncMap((kvt, cb) => {
                            db.addOOO(kvt.value, cb)
                        }),
                        pull.drain(()=>{})
                    )

                })
            })
        )


    });

    test("chessInviteAcceptMessages (non-live)", (t) => {

        const db = SSB.db;
        const time = Date.now();
        console.log("Time is: " + time);

        const exampleStatuses = require('./data/example_statuses.json');
        const firstTen = exampleStatuses.slice(0,10);
       // console.log(firstTen.map(e => e.value.content))

        let s = validate.initial();

        const keys = [];

        firstTen.forEach(
            (msg, index) => {
                const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'invite_accept_messages_key' + index));
                keys.push(`@${playerKey.public}`)

                s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
            }
        );

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => {
                db.addOOO(kvt.value, cb)
            }),
            pull.collect((err, results)=> {
              //  console.log(results.map(e => e.value.content))
                if (err) {
                    t.error(err);
                }

                db.onDrain(() => {
                    const source = dataAccess.chessInviteAcceptMessages(false);

                    // I haven't found a way to delete DB and start again so doing this for now
                    const fromTestOnly = pull.filter(msg => {
       

                        const result = keys.indexOf(msg.value.author) !== -1;
                  

                        return result;
                    });

                    pull(source, fromTestOnly, pull.collect(
                        (err, results) => {
                            t.equals(results.length, 2, "there should be 2 invite accepts");
                            t.end();
                        }
                    ));
                })
            })
        )
    });

    test("chessInviteAcceptMessages (live)", (t) => {
        const db = SSB.db;
        const time = Date.now();
        const exampleStatuses = require('./data/example_statuses.json');
        let s = validate.initial();
        const keys = [];

        const nonLive = exampleStatuses.slice(0,3);
        const lives = exampleStatuses.slice(3,10);

        nonLive.forEach(
            (msg, index) => {
                const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'live_invite_accept_messages_key' + index));
                keys.push(`@${playerKey.public}`)

                s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
            }
        );

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => {
                db.addOOO(kvt.value, cb)
            }),
            pull.collect((err, result) => {
                db.onDrain(() => {

                    const source = dataAccess.chessInviteAcceptMessages(true);

                    const fromTestOnly = pull.filter(msg => msg.sync || keys.indexOf(msg.value.author) !== -1); 

                    pull(source, fromTestOnly, pull.take(3), pull.collect((err, results) => {
                        console.log(results)
                        const withoutSync = results.filter(e => !e.sync);

                        t.assert(results.find(e => e.sync) != null); 

                        //t.assert(results[1].sync == true);

                        t.deepEqual(withoutSync.length, 2, "There should be 2 invite accept messages");

                        t.end();
                    }));

                    lives.forEach(
                        (msg, index) => {
                            const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'live_invite_accept_messages_key' + index));
                            keys.push(`@${playerKey.public}`)
            
                            s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
                        }
                    );

                    pull(
                        pull.values(s.queue),
                        pull.asyncMap((kvt, cb) => {
                            db.addOOO(kvt.value, cb)
                        }),
                        pull.drain(()=>{})
                    )

                })
            })
        )
    });

    test('chessEndMessages (non-live, non-reversed)', (t) => {

        const db = SSB.db;
        const time = Date.now();
        console.log("Time is: " + time);

        const exampleStatuses = require('./data/example_statuses.json');
        const firstTwenty = exampleStatuses.slice(0,20);

        let s = validate.initial();

        const keys = [];

        firstTwenty.forEach(
            (msg, index) => {
                const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'game_end_messages_key' + index));
                keys.push(`@${playerKey.public}`)

                s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
            }
        );

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => {
                db.addOOO(kvt.value, cb)
            }),
            pull.collect((err, results)=> {
              //  console.log(results.map(e => e.value.content))
                if (err) {
                    t.error(err);
                }

                db.onDrain(() => {
                    const source = dataAccess.chessEndMessages(false, false);

                    // I haven't found a way to delete DB and start again so doing this for now
                    const fromTestOnly = pull.filter(msg => {
                        const result = keys.indexOf(msg.value.author) !== -1;
                        return result;
                    });

                    pull(source, fromTestOnly, pull.collect(
                        (err, results) => {
                            t.equals(results.length, 7, "there should be 7 game end messages");
                            const messageBodies = results.map(msg => msg.value.content);
                            const expecteds = firstTwenty.map(msg => msg.value.content).filter(msg => msg.type === "chess_game_end");

                            t.deepEqual(messageBodies, expecteds)

                            t.end();
                        }
                    ));
                })
            })
        )
    });

    test("chessEndMessages (non-live, reversed)", (t) => {
        const db = SSB.db;
        const time = Date.now();
        console.log("Time is: " + time);

        const exampleStatuses = require('./data/example_statuses.json');
        const firstTwenty = exampleStatuses.slice(0,20);

        let s = validate.initial();

        const keys = [];

        firstTwenty.forEach(
            (msg, index) => {
                const playerKey = ssbKeys.loadOrCreateSync(path.join(testDbDir, 'game_end_messages_key' + index));
                keys.push(`@${playerKey.public}`)

                s = validate.appendNew(s, null, playerKey, msg.value.content, time + index + 1);
            }
        );

        pull(
            pull.values(s.queue),
            pull.asyncMap((kvt, cb) => {
                db.addOOO(kvt.value, cb)
            }),
            pull.collect((err, results)=> {
              //  console.log(results.map(e => e.value.content))
                if (err) {
                    t.error(err);
                }

                db.onDrain(() => {
                    const source = dataAccess.chessEndMessages(false, true);

                    // I haven't found a way to delete DB and start again so doing this for now
                    const fromTestOnly = pull.filter(msg => {
                        const result = keys.indexOf(msg.value.author) !== -1;
                        return result;
                    });

                    pull(source, fromTestOnly, pull.collect(
                        (err, results) => {
                            t.equals(results.length, 7, "there should be 7 game end messages");
                            const messageBodies = results.map(msg => msg.value.content);
                            const expecteds = firstTwenty.map(msg => msg.value.content).filter(msg => msg.type === "chess_game_end");

                            t.deepEqual(messageBodies, expecteds.reverse())

                            t.end();
                        }
                    ));
                })
            })
        )
    });


}, 2000);

