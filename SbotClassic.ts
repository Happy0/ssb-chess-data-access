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
    
    get(messageId: String, cb: (err: any, result: any) => any): void {
        this.sbot.get(messageId, cb);
    }
    publishPublic(payload: any, cb: (err: any) => any): void {
        this.sbot.publish(payload, cb);
    }
    publishPrivate(payload: any, participants: String[], cb: (err: any) => any): void {
        this.sbot.private.publish(payload, participants, cb);
    }
    linksToMessage(messageId: String, live: Boolean) {
        const source =  pull(
            this.sbot.backlinks.read({
              query: [{$filter: {dest: messageId}}], // some message hash
              index: 'DTA',
              live: live
            })
        );
        
        return source;
    }
    messagesOfType(messageType: String, live: Boolean) {
        return this.sbot.messagesByType({type: messageType, live: live});
    }
    logStream(live: Boolean, since?: number) {
        return this.sbot.createLogStream({
            live: live,
            gt: since
        });
    }
    follows(userId: String) {
        const follows = this.sbot.links({
            source: userId,
            rel: 'contact',
            values: true,
            reverse: true,
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
    followedBy(userId: string) {
        const followsMe = this.sbot.links({
            dest: userId,
            rel: 'contact',
            values: true,
            reverse: true,
          });


        // Ordering in reverse and filtering for unique means only
        // the latest state (follow / unfollow is taken into account)
        return pull(
            followsMe,
            pull.unique('dest'),
            pull.filter(msg => msg.value.content.following !== false && msg.value.content.blocking !== true),
            pull.map(msg => msg.source)
        );
    }
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) {
        throw new Error('Method not implemented.');
    }
    getLatestMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        throw new Error('Method not implemented.');
    }

}