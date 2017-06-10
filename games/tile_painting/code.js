var tile_polling_interval_ms = 30000;
var pulse_interval_ms = 3000;
var animation_interval_ms = 30;
var pulse_speed_m_per_s = 100;
var pulse_distance_m = 70;
var latitude_divisor = 556;
var longitude_divisor = 342;

var defaultLoc = L.latLng(52.185, 0.176); // a default view of Cambridge
var map = L.map('map').setView(defaultLoc,16);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 22,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
    }).addTo(map);

var player = new Player( defaultLoc );
var got_current_player_location = false;
var pulses = [];
var always_pan_to_user = true;
var tiles = [];

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);
map.on('dragend', function(){ always_pan_to_user=false; } );
requestLocation();
requestTiles();
setInterval( requestTiles,  tile_polling_interval_ms );
setInterval( animatePulses, animation_interval_ms );
setInterval( playerPulse,   pulse_interval_ms );

var console_debug = true;

//addButton("\uD83D\uDC41", "zoom to show all tiles", zoomToShowAll, map);
addButton("\u272A", "go to my location", panToMyLocation, map);
addColorPaintButton("F1433F", paintTile, map);
addColorPaintButton("F7E967", paintTile, map);
addColorPaintButton("A9CF54", paintTile, map);
addColorPaintButton("70B7BA", paintTile, map);
addColorPaintButton("3D4C53", paintTile, map);
addButton("?", "help", function() { window.location.href = 'https://github.com/timhutton/geofun'; }, map );

// ----------------------- classes ------------------------------------

function Player(loc, accuracy_m) {
    this.loc = loc;
    this.accuracy_m = accuracy_m;
}

function Pulse(loc,start_time_ms) {
    this.loc = loc;
    this.state = 0;
    this.start_time_ms = start_time_ms;
}

// ------------------------ functions ---------------------------------

function addColorPaintButton(color,func,map) {
    var button = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function (map) {
        var container = L.DomUtil.create('input','leaflet-control-button');
        container.type  = "button";
        container.title = "paint the tile with this color";
        container.value = "";
        container.label = "";

        container.style.backgroundColor = "#"+color;
        container.style.width = '30px';
        container.style.height = '30px';
        container.onclick = function() { func(color); };
        return container;
      },
    });
    map.addControl(new button());
}

function roundToDivisor(x,divisor) {
    return (Math.floor(x * divisor) + 0.5) / divisor;
}

function getTileCenter(loc) {
    var lat = roundToDivisor(loc.lat,latitude_divisor);
    var lng = roundToDivisor(loc.lng,longitude_divisor);
    return L.latLng(lat,lng);
}

function getTileBounds(loc) {
    var center = getTileCenter(loc);
    return [[center.lat-0.5/latitude_divisor, center.lng-0.5/longitude_divisor],
            [center.lat+0.5/latitude_divisor, center.lng+0.5/longitude_divisor]];
}

function paintTile(color) {
    var loc = getTileCenter(player.loc);
    var tile_spec = "latitude="+loc.lat.toFixed(5)+"&longitude="+loc.lng.toFixed(5)+"&accuracy=10&color="+color;
    if(console_debug) {
        console.log("Ready to send tile string:",tile_spec);
    }
    postString("https://geofun.org.uk/paint/put",tile_spec);
}

function panToMyLocation() {
    map.setView(player.loc,16);
    always_pan_to_user = true;
}

function zoomToShowAll() {
    // TODO
}

function onLocationFound(e) {
    player.loc.lat = e.latlng.lat;
    player.loc.lng = e.latlng.lng;
    player.accuracy_m = e.accuracy/2;
    if(!got_current_player_location) {
        got_current_player_location = true;
        addCurrentPlayerSprites();
    }
    if(typeof current_tile_outline !== 'undefined') {
        map.removeLayer(current_tile_outline);
    }
    current_tile_outline = L.rectangle(getTileBounds(player.loc), {color: "#000000", weight: 1, fill: false});
    current_tile_outline.addTo(map);
    updatePlayerSprites();
    if(always_pan_to_user) {
        map.panTo(player.loc);
    }
    if(console_debug)
        console.log('Got location:',e.latlng.lat,e.latlng.lng,e.accuracy/2);
}

function onLocationError(e) {
    console.log(e.message);
}

function requestLocation() {
    map.locate({ enableHighAccuracy:true, watch:true });
}

function requestTiles() {
    var HttpClient = function() {
        this.get = function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200)
                    callback(xhr.responseText);
            }
            xhr.open( "GET", url, true );
            xhr.send( null );
        }
    }
    var client = new HttpClient();
    // TODO: use a more sensible bounding box - e.g current map view but cache old tiles?
    client.get('https://geofun.org.uk/paint/get/centres?latitude_min=51&latitude_max=53&longitude_min=-1&longitude_max=1', processTilesString);
}

function processTilesString(response) {
    if(console_debug)
        console.log('Received:',response);
    removeAllTiles();
    var lines = response.split('\n');
    for(var i=0;i<lines.length-1;i++) {
        var parts = lines[i].split(',');
        var lat = parseFloat(parts[0]);
        var lng = parseFloat(parts[1]);
        var color = parts[2];
        addTileToMap(L.latLng(lat,lng),color);
    }
}

function removeAllTiles() {
    for(var i = 0; i < tiles.length; ++i) {
        map.removeLayer(tiles[i]);
    }
    tiles = [];
}

function addTileToMap(loc,color) {
    var bounds = getTileBounds(loc);
    var tile = L.rectangle(bounds, {color: "#"+color, weight: 1, fillOpacity: 0.8});
    tile.addTo(map);
    tiles.push(tile);
}

function updatePlayerSprites() {
    if(got_current_player_location) {
        updateCurrentPlayerSprites();
    }
}

function addCurrentPlayerSprites() {
    current_player_marker = L.marker(player.loc);
    current_player_marker.addTo(map);
    current_player_marker.bindPopup("you are here");
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
