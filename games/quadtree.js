// TODO: allow replacing tiles

function QuadTree(boundary) {
    this.boundary = boundary;
    this.MAX_POINTS = 1;
    this.points = [];
    this.children = []; // empty or size 4: NW, NE, SW, SE
    this.updated = 0; // milliseconds since 1970
}

// obj has at least: { XY p; int updated; }
QuadTree.prototype.insert = function(obj) {
    if(!this.boundary.containsPoint(obj.p)) {
        return false; // point is outside our region
    }
    if(this.points.length<this.MAX_POINTS) {
        // no need to subdivide, just store it
        this.points.push(obj);
        // keep track of when any point in this quad was updated
        this.updated = Math.max(this.updated, obj.updated);
        return true;
    }
    if(this.children.length==0) {
        this.subdivide();
    }
    for(var i=0;i<4;i++) {
        if(this.children[i].insert(obj)) {
            // keep track of when any point in any child quad was updated
            this.updated = Math.max(this.updated, obj.updated);
            return true;
        }
    }
    return false;
}

QuadTree.prototype.subdivide = function() {
    var xr = this.boundary.x_radius / 2;
    var yr = this.boundary.y_radius / 2;
    var centers = [ new XY(this.boundary.center.x-xr,this.boundary.center.y-yr),
                    new XY(this.boundary.center.x+xr,this.boundary.center.y-yr),
                    new XY(this.boundary.center.x-xr,this.boundary.center.y+yr),
                    new XY(this.boundary.center.x+xr,this.boundary.center.y+yr) ];
    for(var i=0;i<centers.length;i++) {
        this.children.push(new QuadTree(new AABB(centers[i],xr,yr)));
    }
}

// 'boundary' is AABB, 'since' is int containing milliseconds since 1970
QuadTree.prototype.queryAreaSince = function(boundary,since) {
    var pts = [];
    if(this.updated < since) {
        // nothing in this quad has been updated since the time specified
        return pts;
    }
    if(!this.boundary.intersectsAABB(boundary)) {
        // nothing in this quad is inside the area specified
        return pts;
    }
    for(var i = 0; i < this.points.length; i++) {
        var obj = this.points[i];
        if(obj.updated > since && boundary.containsPoint(obj.p)) {
            pts.push(obj);
        }
    }
    for(var i = 0; i < this.children.length; i++) {
        pts.push(...this.children[i].queryAreaSince(boundary,since));
    }
    return pts;
}

// 'boundary' is AABB, 'since' is int containing milliseconds since 1970
QuadTree.prototype.getNumChangedSince = function(boundary,since) {
    var n = 0;
    if(this.updated < since) {
        // nothing in this quad has been updated since the time specified
        return n;
    }
    if(!this.boundary.intersectsAABB(boundary)) {
        // nothing in this quad is inside the area specified
        return n;
    }
    for(var i = 0; i < this.points.length; i++) {
        var obj = this.points[i];
        if(obj.updated > since && boundary.containsPoint(obj.p)) {
            n++;
        }
    }
    for(var i = 0; i < this.children.length; i++) {
        n += this.children[i].queryAreaSince(boundary,since);
    }
    return n;
}

QuadTree.prototype.debugGetAllQuads = function() {
    var quads = [];
    quads.push(this.boundary);
    for(var i = 0; i < this.children.length; i++) {
        quads.push(...this.children[i].debugGetAllQuads());
    }
    return quads;
}
