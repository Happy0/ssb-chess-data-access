import {Accesser} from '../accesser'
import pull from 'pull-stream'
import Scan from 'pull-scan'
import cat from 'pull-cat'
import AboutOOO from 'ssb-ooo-about'
import {chessMessagesForOtherPlayersGames, chessMessagesForPlayerGames} from './chessMessagesForPlayers'

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
    whoAmI(cb: (err: any, result: string) => void): void {
        this.sbot.whoami(cb)
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

    publishPublicChessMessage(payload: any, cb: (err: any, result: any) => any): void {
        return this.sbot.publish(payload, cb);
    }
    publishPrivateChessMessage(payload: any, participants: String[], cb: (err: any, result: any) => any): void {
        return this.sbot.private.publish(payload, participants, cb);
    }
    getInviteMessage(gameId: String, cb: (err: any, result: any) => any): void {
        return this.sbot.get(gameId, cb);    
    }
    allGameMessages(gameId: String, live: Boolean) {

        const originalMessage = pull(pull.once(gameId), pull.asyncMap(this.sbot.get), pull.map(msg => {
            msg.value = {};
            msg.value.content = msg.content;
            return msg;
        }));

        const backlinks = pull(
            this.sbot.backlinks.read({
              query: [{$filter: {dest: gameId}}], // some message hash
              index: 'DTA',
              live: live
            })
        );

        return cat([originalMessage, backlinks]);
    }

    chessInviteMessages(live: boolean) {
        return pull(this.sbot.messagesByType({type: "chess_invite", live: live}))
    }
    chessInviteAcceptMessages(live: boolean) {
        return pull(this.sbot.messagesByType({type: "chess_invite_accept", live: live}))
    }
    chessEndMessages(live: boolean, reverse: boolean = false, since: number = 0) {
        return pull(this.sbot.messagesByType({type: "chess_game_end", live: live, reverse: reverse, since: since}))
    }
    getLatestAboutMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        const getAboutStream = this.getAboutStream.bind(this);
        const about = AboutOOO(getAboutStream);
        
        about.async.getLatestMsgIds(userId, cb)
    }
    
    follows(userId: String, live: Boolean) {
        const source = this.sbot.links({
            source: userId,
            rel: 'contact',
            values: true,
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
            // Take the list when the stream has gone live, then end
            return pull(stream, pull.take(1));
        } else {
            // Take the initial value then continue emitting updates
            return stream;;
        }
    }

    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) {
        const aboutStream = this.sbot.links({
            dest: userId,
            rel: 'about',
            reverse: true,
            values: true,
            source: userId,
          });

        return pull(aboutStream, pull.find(msg => msg.value.content.name, (err, result) => {
            if (err) {
                cb(err, null);
            } else {
                result = (result && result.value.content.name) ? result.value.content.name : userId;
                cb(null, result);
            }
        }))
    }
  
    chessMessagesForPlayerGames(playerId: any, opts: any) {
        return chessMessagesForPlayerGames(this.sbot, playerId, opts);
    }
    chessMessagesForOtherPlayersGames(playerId: any, opts: any) {
        return chessMessagesForOtherPlayersGames(this.sbot, playerId, opts);
    }

    aboutSelfChangesUserIds(since: number): any {
        return pull(this.sbot.messagesByType({
            type: "about",
            live: true,
            gte: since
          }),
            pull.filter(e => !e.sync),
            pull.filter(e => e.value.author == e.value.content.about),
            pull.map(e => e.value.author)
          );
    }

    getAboutStream(id) {
        return this.sbot.links({
          dest: id,
          rel: "about",
          reverse: true,
          values: true,
          source: id
        })
    }
}
