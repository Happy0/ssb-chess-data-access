
/**
 * Defines all the low level data access functions ssb-chess requires to query the database for
 * chess data, social graph data and publishing messages
 */
export interface Accesser {

    /**
     * Gets a given message by ID
     * 
     * @param messageId The message ID of the message
     */
    get(messageId: String, cb: (err: any, result: any) => any): void

    /*
    * Publishes a message publically
    */
    publishPublic(payload: any, cb: (err: any) => any): void

    /*
    * Publishes a message privately to the given list of participants
    */
    publishPrivate(payload: any, participants: Array<String>, cb: (err: any) => any): void

    /*
    * Returns a pull stream source (https://pull-stream.github.io/) of all the messages which
    * have a 'root' field pointing back to the given message ID.
    * 
    * @param messageId the message ID of the message
    * @param live whether this pull-stream terminates when the currently stored messages have been completely,
    * or whether it waits infinitely and emits messages arriving live.
    * 
    * Should emit a message with contents {sync: true} before going live
    */
    linksToMessage(messageId: String, live: Boolean): any

    /*
    * Returns a pull stream source (https://pull-stream.github.io/) of all the messages which
    * have a 'type' content field of the supplied type.
    * 
    * @param messageType the type of message
    * @param live whether this pull-stream terminates when the currently stored messages have been completely,
    * or whether it waits infinitely and emits messages arriving live.
    * 
    * Should emit a message with contents {sync: true} before going live
    */
    messagesOfType(messageType: String, live: Boolean): any

    /**
     * Plays all messages in database by stored time, beginning since the 'since' timestamp.
     * 
     * @param live whether this pull-stream terminates when the currently stored messages have been completely,
     * or whether it waits infinitely and emits messages arriving live.
     * @param since Only returns any messages which have a timestamp greater than the supplied parameter.1
     */
    logStream(live: Boolean, since?: number): any

    /**
     * Returns a pull-stream of all the user IDs of the users the given user is following.
     * 
     * @param userId the public key of the user to return a stream for
     */
    follows(userId: String): any

    /*
    * Returns a pull-stream of all the userIDs that follow the given user ID.
    */
    followedBy(userId: string): any

    /**
     * Calls back with the display name for the player (if known - otherwise null.)
     * 
     * @param userId the ID of the user to get the latest known display name for 
     * @param cb the result callback
     */
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) : any

    // TODO: functions for https://github.com/Happy0/ssb-ooo-about

}