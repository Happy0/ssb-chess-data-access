import { Accesser } from "./accesser";
import pull from 'pull-stream'
import cat from 'pull-cat'

/**
 * An instance of ssb-browser-core ( https://github.com/arj03/ssb-browser-core )
 * (for when running in a web browser)
 */
export class SbotBrowserCore implements Accesser {
    sbot: any;

    constructor(sbot: any) {
        this.sbot = sbot
    }



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
        let {where, hasRoot, live} = this.sbot.db.dbOperators

        const originalMessage = pull(pull.once(gameId), pull.asyncMap(this.sbot.get))

        const backlinks = this.sbot.db.query(
            where(hasRoot(gameId)),
            live({old: true, live:keepLive})
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
        let {type, where, live} = this.sbot.db.dbOperators;

        const typeStream = this.sbot.db.query(
            where(
                type('chess_invite')
            ),
            live({old: true, live:keepLive})
        )
    
        return typeStream;
    }
    chessInviteAcceptMessages(keepLive: boolean) {
        let {type, where, live} = this.sbot.db.dbOperators;

        const typeStream = this.sbot.db.query(
            where(
                type('chess_invite_accept'),
            ),
            live({old: true, live:keepLive})
        )
    
        return typeStream;
    }
    chessEndMessages(keepLive: boolean, reverse: boolean, since: any) {
        let {type, where, live, descending, gte} = this.sbot.db.dbOperators;

        const typeStreamDescending = this.sbot.db.query(
            where(
                type('chess_game_end'),
            ),
            live({old: true, live:keepLive}),
            gte(since, 'timestamp'),
            descending()
        )

        const typeScreamAscending =  this.sbot.db.query(
            where(
                type('chess_game_end'),
            ),
            live({old: true, live:keepLive}),
            gte(since, 'timestamp')
        )
    
        return reverse ? typeStreamDescending : typeScreamAscending;
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
}
