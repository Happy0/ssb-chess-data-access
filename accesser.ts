
/**
 * Defines all the low level data access functions ssb-chess requires to query the database for
 * chess data, social graph data and publishing messages
 */
export interface Accesser {

    /*
    * Publishes a message publicly. Message should be part of the ssb-chess protocol.
    */
    publishPublicChessMessage(payload: any, cb: (err: any) => any): void

    /*
    * Publishes a message privately to the given list of participants. 
    * Message should be part of the ssb-chess protocol.
    */
    publishPrivateChessMessage(payload: any, participants: Array<String>, cb: (err: any) => any): void

    /**
     * Gets the original chess game invite message by game ID
     * 
     * @param messageId The game ID
     */
    getInviteMessage(game: String, cb: (err: any, result: any) => any): void

    /*
    * Returns a pull stream source of all the ssb-chess messages for the given game ID
    * 
    * @param messageId the ID of the game
    * @param live whether this pull-stream terminates when the currently stored messages have been completely,
    * or whether it waits infinitely and emits messages arriving live.
    * 
    * Should emit a message with contents {sync: true} before going live
    */
    allGameMessages(gameId: String, live: Boolean): any

    /**
     * A pull-stream source of all chess invite status messages (chess_invite, chess_invite_accept, chess_end)
     * ordered by 'received' timestamp (when the message was stored in the database rather than when it was originally
     * made.)
     * 
     * Note: assumed to be slow
     * 
     * Useful for indexing purposes
     * 
     */
     orderedChessStatusMessages(live: boolean, gte?: number): any

    /**
     * A stream of any messages related to a game the player is in
     * 
     * @param playerId the ID of the player
     * @param opts since (timestamp), live (boolean), messageTypes
     */
    chessMessagesForPlayerGames(playerId: string, opts: Object): any
    
    /**
     * A stream of any messages related to a game the player is not in
     * 
     * @param playerId the ID of the player
     * @param opts since (timestamp), live (boolean), messageTypes
     */
    chessMessagesForOtherPlayersGames(playerId: string, opts: Object): any

    /**
     * A pull-stream source of all messages of type 'chess_invite'
     * 
     * @param live whether the stream should continue and emit newly arriving messages
     */
    chessInviteMessages(live: boolean): any

    /**
     * A pull-stream source of all messages of type 'chess_invite_accept'
     * 
     * @param live whether the stream should continue and emit newly arriving messages
     */
    chessInviteAcceptMessages(live: boolean): any

    /**
     * A pull-stream source of all messages of type 'chess_game_end'
     *
     * @param live whether the stream should continue and emit newly arriving messages
     */
    chessEndMessages(live: boolean): any

    /**
     * Returns a pull-stream of all the user IDs of the users the given user is following.
     * Emits an array of user IDs. Emits live updates if 'live' is true 
     * 
     * @param userId the public key of the user to return a stream for
     */
    follows(userId: String, live: boolean): any

    /*
     * Returns a pull-stream of all the user IDs that follow the given user is following.
     * Emits an array of user IDs. Emits live updates if 'live' is true
     * 
     * @param userId the public key of the user to return a stream for
     */
    followedBy(userId: string, boolean): any

    /**
     * Calls back with the display name for the player (if known - otherwise null.)
     * 
     * @param userId the ID of the user to get the latest known display name for 
     * @param cb the result callback
     */
    getPlayerDisplayName(userId: string, cb: (err: any, cb: String) => void) : any

    /**
     * Returns a list of message IDs for the latest known 'about 'messages for the given
     * user (containing a display name, picture, etc, for example.) Used to populate
     * invite message with keys that can be used with ssb-ooo to get information about
     * the user.
     * 
     * @param userId the user to get the latest about messages for
     * @param cb the result callback
     */
    getLatestAboutMsgIds(userId: string, cb: (err: string, result: Array<String>) => void) : any

}