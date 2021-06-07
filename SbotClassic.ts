import {Accesser} from './accesser'

export class SbotClassic implements Accesser {
    sbot: any;

    constructor(sbot: any) {
        this.sbot = sbot
    }
    
    get(messageId: String, cb: (err: any, result: any) => any): void {
        throw new Error('Method not implemented.');
    }
    publishPublic(payload: any, cb: (err: any) => any): void {
        throw new Error('Method not implemented.');
    }
    publishPrivate(payload: any, participants: String[], cb: (err: any) => any): void {
        throw new Error('Method not implemented.');
    }
    linksToMessage(messageId: String, live: Boolean) {
        throw new Error('Method not implemented.');
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