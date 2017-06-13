var location_sending_interval_ms = 5000;
var players_string_polling_interval_ms = 5000;
var pulse_interval_ms = 3000;
var animation_interval_ms = 30;
var pulse_speed_m_per_s = 100;
var pulse_distance_m = 70;

var defaultLoc = L.latLng(52.185, 0.176); // a default view of Cambridge
var map = L.map('map').setView(defaultLoc,16);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 22,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
    }).addTo(map);

getUsername();
var player = new Player( username, defaultLoc );
var got_current_player_location = false;
var players = [];
var other_players_sprites = [];
var pulses = [];
var always_pan_to_user = true;

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);
map.on('dragend', function(){ always_pan_to_user=false; } );
requestLocation();
requestPlayersString();
setInterval( requestPlayersString, players_string_polling_interval_ms );
setInterval( animatePulses,        animation_interval_ms );
setInterval( playerPulse,          pulse_interval_ms );
setInterval( sendPlayerLocation,   location_sending_interval_ms );

var console_debug = false;

//addButton("\u26A1", "spark", playerPulse,map);
addButton("\uD83D\uDC41", "zoom to show all users", zoomToShowAll,map);
addButton("\u272A", "go to my location", panToMyLocation,map);
addButton("\uD83C\uDF81", "gift", placeBox,map);
addButton("?", "help", function() { window.location.href = 'https://github.com/timhutton/geofun'; },map );

// ----------------------- classes ------------------------------------

function Player(id, loc, accuracy_m) {
    this.id = id;
    this.loc = loc;
    this.accuracy_m = accuracy_m;
}

function Pulse(loc,start_time_ms) {
    this.loc = loc;
    this.state = 0;
    this.start_time_ms = start_time_ms;
}

// ------------------------ functions ---------------------------------

function createLabelIcon(labelClass,labelText) {
  return L.divIcon({ className: labelClass, html: labelText });
}

function panToMyLocation() {
    map.setView(player.loc,16);
    always_pan_to_user = true;
}

function zoomToShowAll() {
    if(players.length > 1 ) {
        users = [];
        for(var i =0;i<players.length;++i) {
            users.push([players[i].loc.lat,players[i].loc.lng]);
        }
        map.fitBounds( users, {padding: L.point(40, 40)} );
        always_pan_to_user = false;
    }
    else if(players.length==1) {
        map.panTo(players[0].loc);
    }
    else if(got_current_player_location) {
        panToMyLocation();
    }
}

function onLocationFound(e) {
    player.loc.lat = e.latlng.lat;
    player.loc.lng = e.latlng.lng;
    player.accuracy_m = e.accuracy/2;
    if(!got_current_player_location) {
        got_current_player_location = true;
        addCurrentPlayerSprites();
    }
    updateAllPlayersSprites();
    if(always_pan_to_user) {
        map.panTo(player.loc);
    }
    if(console_debug)
        console.log('Got location:',e.latlng.lat,e.latlng.lng,e.accuracy/2);
}

function onLocationError(e) {
    console.log(e.message);
}

function sendInsertString(s) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://geofun.org.uk/insert", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(s);
    if(console_debug)
        console.log('Sent:',s);
}

function sendPlayerLocation() {
    if(got_current_player_location) {
        var post_string = "oid="+player.id+"&type=user&latitude="+player.loc.lat.toFixed(6)+"&longitude="+player.loc.lng.toFixed(6)+"&accuracy="+player.accuracy_m.toFixed(0);
        sendInsertString(post_string);
        // TODO: slot1=blah&slot2=blah..slot5=blah
    }
}

function placeBox() {
    // make a guid-like string
    var box_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    var post_string = "oid="+box_id+"&type=box&latitude="+player.loc.lat.toFixed(6)+"&longitude="+player.loc.lng.toFixed(6)+"&accuracy="+player.accuracy_m.toFixed(0);
    sendInsertString(post_string);
    // TODO: slot1=blah&slot2=blah..slot5=blah
}

function requestLocation() {
    map.locate({ enableHighAccuracy:true, watch:true });
}

function requestPlayersString() {
    getString("https://geofun.org.uk/data", processPlayersString);
}

function processPlayersString(response) {
    if(console_debug)
        console.log('Received:',response);
    parsePlayersString(response);
    updateOtherPlayersSprites();
}

function parsePlayersString(response) {
    players = [];
    var lines = response.split('\n');
    for(var i=0;i<lines.length-1;i++) {
        var parts = lines[i].split(',');
        var ago = parseFloat(parts[0]);
        var username = parts[1];
        var type = parts[2];
        var lat = parseFloat(parts[3]);
        var lng = parseFloat(parts[4]);
        var accuracy = parseFloat(parts[5]);
        if(type=="user") {
            players.push( new Player( username, new L.latLng(lat,lng), accuracy ));
        }
        else if(type=="box") {
            L.marker(new L.latLng(lat,lng), {icon: createLabelIcon("boxClass","\uD83C\uDF81") }).addTo(map);
        }
    }
}

function updateAllPlayersSprites() {
    updateOtherPlayersSprites();
    if(got_current_player_location) {
        updateCurrentPlayerSprites();
    }
}

function updateOtherPlayersSprites() {
    removeOtherPlayersSprites();
    addOtherPlayersSprites();
}

function removeOtherPlayersSprites() {
    for(var i=0;i<other_players_sprites.length;i++) {
        map.removeLayer(other_players_sprites[i])
    }
    other_players_sprites = [];
}

function addOtherPlayersSprites() {
    for(var i=0;i<players.length;i++) {
        if(players[i].id !== player.id ) {
            var marker = L.marker(players[i].loc);
            marker.addTo(map);
            marker.bindPopup(getOtherPlayerPopupText(players[i]));
            other_players_sprites.push(marker);
            var circle = L.circle(players[i].loc,players[i].accuracy);
            circle.addTo(map);
            other_players_sprites.push(circle);
        }
    }
}

function getOtherPlayerPopupText(p) {
    var link = 'https://www.google.com/maps/dir//'+p.loc.lat.toFixed(6)+','+p.loc.lng.toFixed(6);
    var dist = getDistanceAsString(p.loc.distanceTo(player.loc));
    return p.id+' <a href="'+link+'">'+dist+'</a>';
}

function addCurrentPlayerSprites() {
    current_player_marker = L.marker(player.loc);
    current_player_marker.addTo(map);
    current_player_marker.bindPopup(player.id+" (you)");
    current_player_circle = L.circle(player.loc,player.accuracy);
    current_player_circle.setStyle({opacity: 0.6, fillOpacity: 0.3, color: '#009911' });
    current_player_circle.addTo(map);
}

function updateCurrentPlayerSprites() {
    current_player_marker.update();
    current_player_circle.redraw();
}

function playerPulse() {
    if(!got_current_player_location) {
        return;
    }
    removePulses();
    var time_now_ms = new Date().getTime();
    pulses.push(new Pulse( player.loc, time_now_ms ));
    var have_pulsed = [];
    have_pulsed[player.id] = true;
    // trigger a chain reaction of pulses by proximity
    var added_new = true;
    while(added_new) {
        added_new = false;
        for(var iPulse=0;iPulse<pulses.length;iPulse++) {
            var pulse = pulses[iPulse];
            // does this pulse trigger any player?
            for(var i=0;i<players.length;i++) {
                // does the pulse trigger this player?
                var candidateID = players[i].id;
                var m = players[i].loc.distanceTo(pulse.loc);
                if(!have_pulsed[candidateID] && m < pulse_distance_m ) {
                    var delay_ms = 1000 * ( m / pulse_speed_m_per_s );
                    pulses.push(new Pulse( players[i].loc, pulse.start_time_ms+delay_ms ));
                    have_pulsed[candidateID] = true;
                    added_new = true;
                }
            }
        }
    }
}

function animatePulses() {
    for(var i=pulses.length-1;i>=0;i--) {
        var remove = animatePulse(pulses[i]);
        if( remove ) {
            pulses.splice(i,1);
        }
    }
}

function animatePulse(pulse) {
    var remove = false;
    var time_now_ms = new Date().getTime();
    if(pulse.state == 0) {
        if(time_now_ms>pulse.start_time_ms) {
            pulse.circle = L.circle(pulse.loc, 5);
            pulse.circle.addTo(map);
            pulse.state = 1;
        }
    }
    else {
        if(pulse.circle.getRadius() > pulse_distance_m) {
            map.removeLayer(pulse.circle);
            remove = true;
        }
        else {
            var elapsed_time_s = ( time_now_ms - pulse.start_time_ms ) / 1000;
            var new_radius = 5 + elapsed_time_s * pulse_speed_m_per_s;
            var new_opacity = 1 - new_radius / pulse_distance_m;
            var new_fill_opacity = 0.4 * new_opacity;
            pulse.circle.setRadius(new_radius);
            pulse.circle.setStyle({opacity: new_opacity, fillOpacity: new_fill_opacity});
            pulse.circle.redraw();
        }
    }
    return remove;
}

function removePulses() {
    for(var i=0;i<pulses.length;++i) {
        if( pulses[i].circle !== undefined ) {
            map.removeLayer(pulses[i].circle);
        }
    }
    pulses=[];
}
