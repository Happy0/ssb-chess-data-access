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
        throw new Error('Method not implemented.');
    }
    logStream(live: Boolean, since?: number) {
        throw new Error('Method not implemented.');
    }
    follows(userId: String) {
        throw new Error('Method not implemented.');
    }
    followedBy(userId: string) {
        throw new Error('Method not implemented.');
    }
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) {
        throw new Error('Method not implemented.');
    }
    getLatestMsgIds(userId: string, cb: (err: string, result: String[]) => void) {
        throw new Error('Method not implemented.');
    }

}