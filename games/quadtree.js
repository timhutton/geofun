function XY(x, y) {
    this.x = x;
    this.y = y;
}

function AABB(center, x_radius, y_radius) {
    this.center = center;
    this.x_radius = x_radius;
    this.y_radius = y_radius;
}

AABB.prototype.containsPoint = function(p) {
    return ( p.x >= this.center.x - this.x_radius )
        && ( p.x <= this.center.x + this.x_radius )
        && ( p.y >= this.center.y - this.y_radius )
        && ( p.y <= this.center.y + this.y_radius );
}

AABB.prototype.intersectsAABB = function(other) {
    return (Math.abs(other.center.x - this.center.x) < (other.x_radius + this.x_radius)) &&
           (Math.abs(other.center.y - this.center.y) < (other.y_radius + this.y_radius));
}

function QuadTree(boundary) {
    this.boundary = boundary;
    this.MAX_POINTS = 10;
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