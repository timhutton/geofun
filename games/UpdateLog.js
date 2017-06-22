function UpdateLog() {
    this.time_slots = [100,1000,10000,100000,1000000]; // 100s to 1Ms=11days
}

UpdateLog.prototype.add = function(t) {
    // TODO: add the event into the log
}

UpdateLog.prototype.moreEventsThanNSinceT(n,t) {
    // TODO: return whether we know for sure that there were more events than n since time t
}
