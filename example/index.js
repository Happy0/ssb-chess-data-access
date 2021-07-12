const Client = require('ssb-client')
const { SbotClassic } = require('../lib/index');
const pull = require('pull-stream');

Client( (err, ssbClient) => {
    const sbot = new SbotClassic(ssbClient);
    const me = "@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519"

    //sbot.get("%ywBCsPJuoXs3zwUd7bbuDm5OIJAYqH5xE27WsrpVegI=.sha256", (err, result) => console.log(result));

    var msg = {
        "type": "testaroonie",
        "testtest": "Testing stuff and things..."
    }

    //pull(sbot.followedBy(me), pull.drain(e => console.log(e)));

    //sbot.publishPublic(msg, (err, result) => {console.log(err) ; console.log(result)})
    //sbot.publishPrivate(msg, ["@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519"], (err, result)=> {console.log(err); console.log(result)});

    // pull(
    //     sbot.allGameMessages('%QycN67xQP1gHB9+LIct4KGmwDTBNhmUa1QT0TFshZvA=.sha256', false),
    //     pull.filter(msg => {return msg.value && msg.value.content.type !== "chess_chat"}),
    //     pull.collect((ee, msgs) => console.log(JSON.stringify(msgs)))
    // );

    const chessTypeMessages = [
        'chess_invite',
        'chess_invite_accept',
        'chess_game_end'
    ];

    pull(
        sbot.chessMessagesForOtherPlayersGames("@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519", {live: false, messageTypes: chessTypeMessages}),
        pull.take(100),
        pull.collect((err, result) => {
            console.log(JSON.stringify(result));
        })
      )


    //pull(sbot.chessEndMessages(true, true), pull.drain(msg => console.log(msg)))

   // pull(sbot.logStream(true, 1623441679136), pull.drain(msg => console.log(msg)))

   // pull(sbot.followedBy("@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519"), pull.drain(msg => console.log(msg)))

    // const all = sbot.orderedChessStatusMessages(true)

    // pull(all,
    //     pull.drain(e => console.log(e))
    // )

   // sbot.getLatestAboutMsgIds(me, (err, data) => console.log(data));

   //sbot.getPlayerDisplayName(me, (err, result) => console.log(result))

  // pull(sbot.chessMessagesForPlayerGames(me, {since: Date.now() - 120000000   }), pull.drain(e => console.log(e)))

    // const aboutStream = sbot.aboutSelfChangesUserIds(1624046946377)
    // pull(aboutStream, pull.drain(e => console.log(e)))


});
