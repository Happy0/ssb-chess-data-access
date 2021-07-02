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
    allGameMessages(gameId: String, live: Boolean) {
        const originalMessage = pull(pull.once(gameId), pull.asyncMap(this.sbot.get))

        let {where, hasRoot} = this.sbot.db.dbOperators

        const backlinks = this.sbot.db.query(
            where(hasRoot(gameId)
        ))

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
    chessInviteMessages(live: boolean) {
        throw new Error("Method not implemented.");
    }
    chessInviteAcceptMessages(live: boolean) {
        throw new Error("Method not implemented.");
    }
    chessEndMessages(live: boolean, reverse: boolean, since: any) {
        throw new Error("Method not implemented.");
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
