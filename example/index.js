const Client = require('ssb-client')
const { SbotClassic } = require('../lib/index');

Client( (err, ssbClient) => {
    const sbot = new SbotClassic(ssbClient)

    //sbot.get("%ywBCsPJuoXs3zwUd7bbuDm5OIJAYqH5xE27WsrpVegI=.sha256", (err, result) => console.log(result));

    var msg = {
        "type": "testaroonie",
        "testtest": "Testing stuff and things..."
    }

    //sbot.publishPublic(msg, (err, result) => {console.log(err) ; console.log(result)})

    sbot.publishPrivate(msg, ["@RJ09Kfs3neEZPrbpbWVDxkN92x9moe3aPusOMOc4S2I=.ed25519"], (err, result)=> {console.log(err); console.log(result)});

});