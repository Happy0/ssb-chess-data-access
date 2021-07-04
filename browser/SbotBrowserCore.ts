import { Accesser } from "../accesser";
import pull from 'pull-stream'
import cat from 'pull-cat'
import Pushable from 'pull-pushable'
import Abortable from 'pull-abortable'
import AboutOOO from 'ssb-ooo-about'

/**
 * An instance of ssb-browser-core ( https://github.com/arj03/ssb-browser-core )
 * (for when running in a web browser)
 */
export class SbotBrowserCore implements Accesser {
    sbot: any;

    constructor(sbot: any) {
        this.sbot = sbot
    }

    chessTypeMessages = [
        'chess_invite',
        'chess_move',
        'chess_invite_accept',
        'chess_game_end'];

    syncMsg = {sync: true}
    syncMsgStream = pull.once(this.syncMsg);

    whoAmI(cb: (err: any, result: string) => void): void {
        const myId = this.sbot.net.id
        cb(null, myId);
    }
    publishPublicChessMessage(payload: any, cb: (err: any) => any): void {
        this.sbot.net.publish(payload, cb);
    }
    publishPrivateChessMessage(payload: any, participants: String[], cb: (err: any) => any): void {
        const content = this.sbot.box(payload, participants.map((x) => x.substr(1)));
        this.sbot.publish(content, cb);
    }
    getInviteMessage(gameId: String, cb: (err: any, result: any) => any): void {
        this.sbot.db.get(gameId, cb);
    }
    allGameMessages(gameId: String, keepLive: Boolean) {
        let {where, hasRoot, live, toPullStream} = this.sbot.db.dbOperators

        const originalMessage = pull(pull.once(gameId), pull.asyncMap(this.sbot.get))

        const backlinks = this.sbot.db.query(
            where(hasRoot(gameId)),
            live({old: true, live:keepLive}),
            toPullStream()
        )

        return pull(cat([originalMessage, backlinks]));
    }

    chessMessagesForPlayerGames(playerId: string, opts: any) {
        return this.chessMessageStreamForPlayerGames(playerId, true, opts);
    }

    chessMessagesForOtherPlayersGames(playerId: string, opts: Object) {
        return this.chessMessageStreamForPlayerGames(playerId, false, opts);
    }
    chessInviteMessages(keepLive: boolean) {
        let {type, where, live, toPullStream} = this.sbot.db.dbOperators;

        const makeStream = (liveOnly: boolean) => {
            return this.sbot.db.query(
                where(
                    type('chess_invite')
                ),
                live({old: !liveOnly, live:liveOnly}),
                toPullStream()
            )
        }

        const oldStream = makeStream(false);
        const liveStream = makeStream(true);
    
        if (!keepLive) {
            return oldStream;
        } else {
            return this.makeLiveStream(oldStream, liveStream)
        }
    }
    chessInviteAcceptMessages(keepLive: boolean) {
        let {type, where, live, toPullStream} = this.sbot.db.dbOperators;

        const makeStream = (liveOnly: boolean) => {
            return this.sbot.db.query(
                where(
                    type('chess_invite_accept')
                ),
                live({old: !liveOnly, live:liveOnly}),
                toPullStream()
            )
        }

        const oldStream = makeStream(false);
        const liveStream = makeStream(true);
    
        if (!keepLive) {
            return oldStream;
        } else {
            return this.makeLiveStream(oldStream, liveStream)
        }
    }
    chessEndMessages(keepLive: boolean, reverse: boolean, since: any) {
        let {and, type, where, live, descending, gte, toPullStream} = this.sbot.db.dbOperators;

        const makeStream = (reverse: boolean, isLive: boolean) => {
            const typeStreamDescending = this.sbot.db.query(
                where(
                    and(
                        type('chess_game_end'),
                        gte(since, 'timestamp'),
                    )
                ),
                live({old: !isLive, live:isLive}),
                descending(),
                toPullStream()
            )
    
            const typeScreamAscending =  this.sbot.db.query(
                where(
                    and(
                        type('chess_game_end'),
                        gte(since, 'timestamp'),
                    )
                ),
                live({old: !isLive, live:isLive}),
                toPullStream()
            )
        
            return reverse ? typeStreamDescending : typeScreamAscending;
        }

        const oldStream = makeStream(reverse, false);
        const newStream = makeStream(reverse, false);

        if (!keepLive) {
            return oldStream;
        } else {
            return this.makeLiveStream(oldStream, newStream);
        }
      
    }
    follows(userId: String, live: boolean) {
        if (live) {
            console.log("Live follows not yet implemented")
        }

        return pull(
            pull.once(userId),
            pull.asyncMap(this.sbot.getGraphForFeed),
            pull.map(result => result.following)
        );
    }
    followedBy(userId: string, live: boolean) {
        if (live) {
            console.log("Live follows not yet implemented")
        }

        const opts = {
          start: userId,
          max: 1
        }

        return pull(
            pull.once(opts),
            pull.asyncMap(this.sbot.net.friends.hops),
            pull.map(feeds => {
                const followers = []
                for(var f of feeds) {
                  if (feeds[f] > 0)
                    followers.push(f)
                }

                return followers;
            })
        )
    }
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) {
        const displayName = this.sbot.getProfileName(userId)
        cb(null, displayName);
    }
    getLatestAboutMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        const getAboutStream = this.getAboutStream.bind(this);
        const about = AboutOOO(getAboutStream);

        about.async.getLatestMsgIds(userId, cb);
    }
    aboutSelfChangesUserIds(since: number) {
        let {and, type, where, live, gte, toPullStream} = this.sbot.db.dbOperators;

        return pull(this.sbot.query(
            where(
                and(
                    type("about"),
                    gte(since, 'timestamp')
                )
            ),
            live({old: true, live:true}),
            toPullStream()
        ),
            pull.filter(e => e.value.author == e.value.content.about),
            pull.map(e => e.value.author)
        )
    }
    orderedChessStatusMessages(live: boolean, gte?: number) {
        // This isn't actually needed by anything yet... I just thought it might be useful in the future.
        // Will implement later...
        throw new Error("Method not implemented.");
    }

    // TODO: write a comment explaining this...
    makeLiveStream(oldStream, liveStream) {
        let timestamp = 0;
        let key = null;

        const abortable1 = Abortable();
        const abortable2 = Abortable(() => abortable1.abort());
        
        const livePushable = Pushable();

        pull(liveStream, abortable2, pull.drain(msg => livePushable.push(msg)));

        const olds = pull(oldStream, pull.map(msg => {
            timestamp = msg.timestamp;
            key = msg.key;
            return msg;
        }));

        // Don't repeat any we already seen in the old stream...
        const news = pull(livePushable, 
            pull.filter(msg => msg.timestamp > timestamp || (msg.timestamp === timestamp && msg.key !== key))
        );

        return cat([olds, this.syncMsgStream, abortable1, news])                
    }

    getAboutStream(id) {
        let {type, where, descending, toPullStream} = this.sbot.db.dbOperators;

        return this.sbot.query(
            where(
                type("about")
            ),
            descending()
        )
    }

    chessMessageStreamForPlayerGames(playerId: string, playerShouldBeIn: boolean, opts: any) {
        let {where, or, and, gte, type, descending, toPullStream} = this.sbot.db.dbOperators;
        const messageTypes = opts && opts.messageTypes ? opts.messageTypes : this.chessTypeMessages;
        const since = opts ? opts.since : 0;
        const reverse = opts ? opts.reverse : false;

        const getSourceStream = () => {
            if (reverse) {
                return this.sbot.db.query(
                    where(
                        and(
                            or(
                                messageTypes.map(typeValue => type(typeValue))
                            ),
                            gte(since, 'timestamp')
                        )
                    ),
                    descending(),
                    toPullStream()
                )
            } else {
                return this.sbot.db.query(
                    where(
                        and(
                            or(
                                messageTypes.map(typeValue => type(typeValue))
                            ),
                            gte(since, 'timestamp')
                        )
                    ),
                    toPullStream()
                )
            }
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

        function getGameId(msg) {
            if (msg.value.content.type === 'chess_invite') {
              return msg.key;
            }
            if (!msg.value || !msg.value.content || !msg.value.content.root) {
              return null;
            }
            return msg.value.content.root;
          }

        const messageWithPlayerCheck = (msg, cb) => {
            const gameId = getGameId(msg);

            this.getInviteMessage(gameId, (err, msg) => {
                if (err) {
                    cb(err, null);
                    return;
                }

                const playerInGame = isPlayerInInvite(msg, playerId);

                cb(err, {
                    msg: msg,
                    check: playerInGame
                })

            })

        }

        return pull(
            getSourceStream(),
            pull.asyncMap(messageWithPlayerCheck),
            pull.filter(msg => playerShouldBeIn ? msg.check : !msg.check),
            pull.map(msg => msg.msg)
        )
    }

}
