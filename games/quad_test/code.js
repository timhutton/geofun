 // Testing our quadtree implementation

// TODO: Use Point coordinates for square tiles. Store in quadtree as integers to avoid ambiguity. Replace tiles when updated.

// TODO: Have two quadtrees one as a server, the other as a client, updating itself. Check
// that can get reasonable updating behavior with low bandwidth even when the server has
// many tiles. Mark higher level quads as checked but too many tiles to update.

// TODO: As above but cache locally to save on startup time.

// TODO: To answer question of how many changed since time t, consider storing on each quad an approximate integral, e.g. 0 changed
// within the last 10s, 1 changed within the last 100s, 10 changed within the last 1000s.

var defaultLoc = L.latLng(52.185, 0.176); // a default view of Cambridge
var map = L.map('map').setView(defaultLoc,0);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 22,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
    }).addTo(map);
map.on('dragend', updateTileOutline );


addButton("\u272A", "add random points", addRandomPoints, map);
var x_range = 20026376.39; // tiles with centers at 324n units in this coordinate system, with n in [-61809, 61809]
var y_range = 20048966.10; // likewise with n in [-61879, 61879]
var quadtree = new QuadTree(new AABB(new XY(0,0),x_range,y_range));
var quad_layers = []

function latLngToTileIndices(latlng) {
    var divisor = 324;
    var p = L.Projection.SphericalMercator.project(latlng);
    return { x: Math.round(p.x/divisor), y: Math.round(p.y/divisor) };
}

function tileIndicesToLatLng(p) {
    var divisor = 324;
    return L.Projection.SphericalMercator.unproject(new L.Point(p.x*divisor,p.y*divisor));
}

function getTileBounds(loc) {
    var tc = latLngToTileIndices(loc);
    var p1 = tileIndicesToLatLng(new L.Point(tc.x-0.5,tc.y-0.5));
    var p2 = tileIndicesToLatLng(new L.Point(tc.x+0.5,tc.y+0.5));
    return [p1,p2];
}

function updateTileOutline() {
    if(typeof current_tile_outline !== 'undefined') {
        map.removeLayer(current_tile_outline);
    }
    current_tile_outline = L.rectangle(getTileBounds(map.getCenter()), {color: "#000000", weight: 1, fill: false});
    current_tile_outline.addTo(map);
}

function eraseQuads() {
    for(var i=0;i<quad_layers.length;i++) {
        map.removeLayer(quad_layers[i]);
    }
    quad_layers=[];
}

function drawQuads() {
    quads = quadtree.debugGetAllQuads();
    for(var i=0;i<quads.length;i++) {
        drawQuad(quads[i]);
    }
}

function drawQuad(q) {
    var p1 = L.Projection.SphericalMercator.unproject(new L.Point(q.center.x-q.x_radius,q.center.y-q.y_radius));
    var p2 = L.Projection.SphericalMercator.unproject(new L.Point(q.center.x+q.x_radius,q.center.y+q.y_radius));
    var bounds = [[p1.lat,p1.lng],[p2.lat,p2.lng]];
    var quad_layer = L.rectangle(bounds,{color:"#000000",weight:1,fill:false});
    quad_layer.addTo(map);
    quad_layers.push(quad_layer);
}


function addRandomPoints() {
    for(var i=0;i<10;i++) {
        var obj = { p: new XY(randn_bm()*1000000,randn_bm()*1000000), updated: 0 };
        quadtree.insert(obj);
        L.circle(L.Projection.SphericalMercator.unproject(obj.p),10).addTo(map);
    }
    eraseQuads();
    drawQuads();
}

function randn_bm() {
    var u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
    var v = 1 - Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}
