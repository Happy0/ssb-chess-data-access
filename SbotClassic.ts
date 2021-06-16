import {Accesser} from './accesser'
import pull from 'pull-stream'
import Scan from 'pull-scan';

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

    orderedChessStatusMessages(live: boolean, gte?: number) {
        const query = [
            {
            "$filter": {
                timestamp: {
                    "$gt": gte
                },
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
            query: query,
            live: live
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
        const source = this.sbot.links({
            source: userId,
            rel: 'contact',
            values: true,
            reverse: true,
            live: true
        });

        const state = {
            result: [],
            live: false
        };

        const scanFn = (state, msg) => {
           // console.log(msg)
            if (msg.sync) {
                state.live = true;
            }
            else if (msg.value.content.blocking === true || msg.value.content.following === false) {
                state.result = state.result.filter(id => id !== msg.dest);
            } else if (msg.value.content.following === true) {
            
                if (state.result.indexOf(msg.dest) === -1) {
                    state.result.push(msg.dest);
                }
            }

            return state;
        }

        const stream = pull(
            source,
            Scan(scanFn, state),
            pull.filter(state => state.live),
            pull.map(state => state.result)
        );

        if (!live) {
            console.log()
            // Take the list when the stream has gone live, then end
            return pull(stream, pull.take(1));
        } else {
            // Take the initial value then continue emitting updates
            return stream;;
        }
    }
    followedBy(userId: string, live: Boolean) {
        const source = this.sbot.links({
            dest: userId,
            rel: 'contact',
            values: true,
            reverse: true,
            live: true
        });

        const state = {
            result: [],
            live: false
        };

        const scanFn = (state, msg) => {
           // console.log(msg)
            if (msg.sync) {
                state.live = true;
            }
            else if (msg.value.content.blocking === true || msg.value.content.following === false) {
                state.result = state.result.filter(id => id !== msg.source);
            } else if (msg.value.content.following === true) {
            
                if (state.result.indexOf(msg.source) === -1) {
                    state.result.push(msg.source);
                }
            }

            return state;
        }

        const stream = pull(
            source,
            Scan(scanFn, state),
            pull.filter(state => state.live),
            pull.map(state => state.result)
        );

        if (!live) {
            console.log()
            // Take the list when the stream has gone live, then end
            return pull(stream, pull.take(1));
        } else {
            // Take the initial value then continue emitting updates
            return stream;;
        }
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