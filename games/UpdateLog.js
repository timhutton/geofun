function UpdateLog() {
    this.time_slots = [100,1000,10000,100000,1000000]; // 100s to 1Ms=11days
    this.last_event = [0,0,0,0,0];
    this.n_since = [0,0,0,0,0];
}

UpdateLog.prototype.add = function() {
    var time_now = new Date().getTime();
    // add the event at time time_now into the log
}

UpdateLog.prototype.moreEventsThanNSinceT(n,t) {
    // return whether we know for sure that there were more events than n since time t
    var time_now = new Date().getTime();
    var since_in_seconds = (time_now - t)/1000;
    for(var i=0;i<this.time_slots.length;i++) {
        if( since_in_seconds > this.time_slots[i] ) {
        {
            return n_since[i] > n;
        }
    }
    return false;
}
