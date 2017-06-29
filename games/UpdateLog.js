function UpdateLog() {
    this.time_slots = [100,1000,10000,100000,1000000]; // N time slots: each is emptied at intervals ranging from 100s to 1Ms=11days
    this.last_emptied = [0,0,0,0,0]; // N: time in seconds since 1970-01-01 of the last time this slot was emptied
    this.n_since = [0,0,0,0,0,0]; // N+1: count of events in this slot
}

UpdateLog.prototype.add = function() {
    // add an event to the log
    var time_now = getTime();
    this.refreshSlots(time_now);
    this.n_since[0]++;
}

UpdateLog.prototype.moreEventsThanNSinceT(n,t) {
    // return true if we think there may have been more events than n since time t (in seconds since 1970-01-01)
    var time_now = getTime();
    this.refreshSlots(time_now);
    var seconds_since_t = time_now - t;
    var events_found = this.n_since[0];
    for( var i = 1; i < this.time_slots.length; i++ ) {
        if( this.time_slots[i] > seconds_since_t ) {
            break;
        }
        events_found += n_since[i];
    }
    return events_found > n;
}

UpdateLog.prototype.refreshSlots(time_now) {
    for( var i = 0; i < this.time_slots.length; i++ ) {
        var seconds_since_last_emptied = time_now - this.last_emptied[i];
        if( seconds_since_last_emptied > this.time_slots[i] ) {
            // move all the contents of this slot into the next one
            this.n_since[i+1] += this.n_since[i];
            this.n_since[i] = 0;
            this.last_emptied[i] = time_now;
        }
    }
}

UpdateLog.prototype.getTime = function() {
    // get the time, in seconds since 1970-01-01
    return new Date().getTime() / 1000;
}
