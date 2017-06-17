
var defaultLoc = L.latLng(52.185, 0.176); // a default view of Cambridge
var map = L.map('map').setView(defaultLoc,0);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 22,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.light'
    }).addTo(map);

addButton("\u272A", "add random points", addRandomPoints, map);
quadtree = new QuadTree(new AABB(new XY(0,0),180,85));
quad_layers = []

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
    var bounds = [[q.center.y-q.y_radius,q.center.x-q.x_radius],
                  [q.center.y+q.y_radius,q.center.x+q.x_radius]];
    var quad_layer = L.rectangle(bounds,{color:"#000000",weight:1,fill:false});
    quad_layer.addTo(map);
    quad_layers.push(quad_layer);
}


function addRandomPoints() {
    for(var i=0;i<10;i++) {
        var obj = { p: new XY(randn_bm()*30,randn_bm()*30), updated: 0 };
        quadtree.insert(obj);
        L.circle(new L.LatLng(obj.p.y,obj.p.x),10).addTo(map);
    }
    eraseQuads();
    drawQuads();
}

function randn_bm() {
    var u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
    var v = 1 - Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}
