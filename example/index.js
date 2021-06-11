const Client = require('ssb-client')
const { SbotClassic } = require('../lib/index');
const pull = require('pull-stream');

Client( (err, ssbClient) => {
    const sbot = new SbotClassic(ssbClient)

    //sbot.get("%ywBCsPJuoXs3zwUd7bbuDm5OIJAYqH5xE27WsrpVegI=.sha256", (err, result) => console.log(result));

    var msg = {
        "type": "testaroonie",
        "testtest": "Testing stuff and things..."
    }

    //sbot.publishPublic(msg, (err, result) => {console.log(err) ; console.log(result)})
    //sbot.publishPrivate(msg, ["@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519"], (err, result)=> {console.log(err); console.log(result)});

    //pull(sbot.linksToMessage('%LK5VCri5eXat1f04k8jNhB/rg5hUylNz9dGSpTdZL7A=.sha256', true), pull.drain(msg => console.log(msg)));

    //pull(sbot.messagesOfType("chess_invite", true), pull.drain(msg => console.log(msg)))

});