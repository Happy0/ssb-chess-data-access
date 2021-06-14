import {Accesser} from './accesser'
import pull from 'pull-stream'

/**
 * A typical(ish) ssb-server, as in the one ran by Patchwork for example.
 * 
 * Assumes the `ssb-backlinks` and 'ssb-private' plugins are installed
 */
export class SbotClassic implements Accesser {
    sbot: any;

    constructor(sbot: any) {
        this.sbot = sbot
    }

    orderedChessStatusMessages() {
        const query = [
            {
            "$filter": {
                value: {
                    content: {
                    type: {
                        "$in": ["chess_invite", "chess_invite_accept", "chess_end"]
                    }
                }
            }
            }
            }
        ]

        return this.sbot.query.read({
            query: query
        })
    }

    publishPublicChessMessage(payload: any, cb: (err: any) => any): void {
        return this.sbot.publish(payload, cb);
    }
    publishPrivateChessMessage(payload: any, participants: String[], cb: (err: any) => any): void {
        return this.sbot.private.publish(payload, participants, cb);
    }
    getInviteMessage(gameId: String, cb: (err: any, result: any) => any): void {
        return this.sbot.get(gameId, cb);    
    }
    allGameMessages(gameId: String, live: Boolean) {
        throw new Error('Method not implemented.');
    }
    chessInviteMessages(live: boolean) {
        throw new Error('Method not implemented.');
    }
    chessInviteAcceptMessages(live: boolean) {
        throw new Error('Method not implemented.');
    }
    chessEndMessages(live: boolean) {
        throw new Error('Method not implemented.');
    }
    getLatestAboutMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        throw new Error('Method not implemented.');
    }

    // linksToMessage(messageId: String, live: Boolean) {
    //     const source =  pull(
    //         this.sbot.backlinks.read({
    //           query: [{$filter: {dest: messageId}}], // some message hash
    //           index: 'DTA',
    //           live: live
    //         })
    //     );
        
    //     return source;
    // }

    
    follows(userId: String, live: Boolean) {
        const follows = this.sbot.links({
            source: userId,
            rel: 'contact',
            values: true,
            reverse: true
        });

        // Ordering in reverse and filtering for unique means only
        // the latest state (follow / unfollow is taken into account)
        return pull(
            follows,
            pull.unique('dest'),
            pull.filter(msg => msg.value.content.following !== false && msg.value.content.blocking !== true),
            pull.map(msg => msg.dest)
        );
    }
    followedBy(userId: string, live: Boolean) {
        const followsMe = this.sbot.links({
            dest: userId,
            rel: 'contact',
            values: true,
            reverse: true
          });


        // Ordering in reverse and filtering for unique means only
        // the latest state (follow / unfollow is taken into account)
        return pull(
            followsMe,
            pull.unique('source'),
            pull.filter(msg => msg.value.content.following !== false),
            pull.map(msg => msg.source)
        );
    }
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) {
        throw new Error('Method not implemented.');
    }
    getLatestMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        throw new Error('Method not implemented.');
    }

    chessMessagesForPlayerGames(playerId: any, opts: Object) {
        throw new Error('Method not implemented.');
    }
    chessMessagesForOtherPlayersGames(playerId: any, opts: Object) {
        throw new Error('Method not implemented.');
    }

}