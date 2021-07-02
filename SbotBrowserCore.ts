import { Accesser } from "./accesser";
import pull from 'pull-stream'
import cat from 'pull-cat'
import Pushable from 'pull-pushable'
import Abortable from 'pull-abortable'

/**
 * An instance of ssb-browser-core ( https://github.com/arj03/ssb-browser-core )
 * (for when running in a web browser)
 */
export class SbotBrowserCore implements Accesser {
    sbot: any;

    constructor(sbot: any) {
        this.sbot = sbot
    }

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
    orderedChessStatusMessages(live: boolean, gte?: number) {
        throw new Error("Method not implemented.");
    }
    chessMessagesForPlayerGames(playerId: string, opts: Object) {
        throw new Error("Method not implemented.");
    }
    chessMessagesForOtherPlayersGames(playerId: string, opts: Object) {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }
    followedBy(userId: string, live: boolean) {
        throw new Error("Method not implemented.");
    }
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) {
        throw new Error("Method not implemented.");
    }
    getLatestAboutMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        throw new Error("Method not implemented.");
    }
    aboutSelfChangesUserIds(since: number) {
        throw new Error("Method not implemented.");
    }

    // TODO: write a comment explaining this...
    makeLiveStream(oldStream, liveStream) {
        let timestamp = 0;

        const abortable1 = Abortable();
        const abortable2 = Abortable(() => abortable1.abort());
        
        const livePushable = Pushable();

        pull(liveStream, abortable2, pull.drain(msg => livePushable.push(msg)));

        const olds = pull(oldStream, pull.map(msg => {
            timestamp = msg.timestamp;
            return msg;
        }));

        // Don't repeat any we already seen in the old stream...
        const news = pull(livePushable, pull.filter(msg => msg.timestamp > timestamp));

        return cat([olds, this.syncMsgStream, abortable1, news])                
    }

}
