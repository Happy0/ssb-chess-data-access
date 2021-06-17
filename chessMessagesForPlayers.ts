import pull from 'pull-stream'
import asyncRemove from 'pull-async-filter'

const chessTypeMessages = [
    'chess_invite',
    'chess_move',
    'chess_invite_accept',
    'chess_game_end'];

export function chessMessagesForPlayerGames(sbot: any, playerId: any, opts: any) {
    const since = opts ? opts.since : null;
    const reverse = opts ? opts.reverse : false;
    const messageTypes = opts && opts.messageTypes ? opts.messageTypes : chessTypeMessages;

    // Default to live
    const liveStream = (opts && (opts.live !== undefined && opts.live !== null)) ? opts.live : true;

    const liveFeed = sbot.createLogStream({
      live: liveStream,
      gt: since,
      reverse,
    });

    return pull(
      liveFeed,
      msgMatchesFilter(
        sbot,
        playerId,
        true,
        messageTypes,
      ),
    );
}
export function chessMessagesForOtherPlayersGames(sbot: any, playerId: any, opts: any) {
    const since = opts ? opts.since : null;
    const reverse = opts ? opts.reverse : false;
    const messageTypes = opts && opts.messageTypes ? opts.messageTypes : chessTypeMessages;

    const liveFeed = sbot.createLogStream({
      live: true,
      gt: since,
      reverse,
    });

    return pull(
      liveFeed,
      msgMatchesFilter(
        sbot,
        playerId,
        false,
        messageTypes,
      ),
    );
}


function msgMatchesFilter(sbot, playerId, playerShouldBeInGame, messageTypes) {
    return pull(
      pull(
        pull.filter(msg => isChessMessage(msg, messageTypes)),
        asyncRemove((msg, cb) => {
          const gameId = getGameId(msg);

          if (gameId == null) {
            cb(null, false);
          } else {
            gameHasPlayer(sbot, gameId, playerId, (err, result) => {
              if (playerShouldBeInGame) {
                cb(err, !result);
              } else {
                cb(err, result);
              }
            });
          }
        }),
      ),
    );
  }


  function isChessMessage(msg, msgTypes) {
    if (!msg.value || !msg.value.content) {
      return false;
    }

    return msgTypes.indexOf(msg.value.content.type) !== -1;
  }

  function getGameId(msg) {
    if (msg.value.content.type === 'chess_invite') {
      return msg.key;
    }
    if (!msg.value || !msg.value.content || !msg.value.content.root) {
      return null;
    }
    return msg.value.content.root;
  }

  function gameHasPlayer(sbot, gameId, playerId, cb) {
    sbot.get(gameId, (err, msg) => {
        if (msg == null || err) {
            cb(err, null)
        } else {
            cb(null, isPlayerInInvite(msg, playerId))
        }
    });
  }

  const isPlayerInInvite = (msg, id) => {
    // sbot.get has a different schema...
    if (!msg.value) {
        msg.value = {};
        msg.value.author = msg.author;
        msg.value.content = msg.content;
    }

    return msg.value.author == id || msg.value.content.inviting == id;
}
