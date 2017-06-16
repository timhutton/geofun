function XY(x, y) {
    this.x = x;
    this.y = y;
}

function AABB(center, radius) {
    this.center = center;
    this.radius = radius;
}

AABB.prototype.containsPoint = function(p) {
    return p.x >= this.center.x - this.radius
        && p.x <= this.center.x + this.radius
        && p.y >= this.center.y - this.radius
        && p.y <= this.center.y + this.radius;
}

AABB.prototype.intersectsAABB = function(other) {
    return (Math.abs(other.center.x - this.center.x) < (other.radius + this.radius)) &&
           (Math.abs(other.center.y - this.center.y) < (other.radius + this.radius));
}

function QuadTree(boundary) {
    this.boundary = boundary;
    this.MAX_POINTS = 10;
    this.points=[];
    this.children=[]; // empty or size 4: NW, NE, SW, SE
    this.last_updated = 0; // milliseconds since 1970
}

// insert any object that has a member p of type XY
QuadTree.prototype.insert = function(obj) {
    if(!this.boundary.containsPoint(obj.p)) {
        return false; // point is outside our region
    }
    if(this.points.length<this.MAX_POINTS) {
        // no need to subdivide, just store it
        this.points.push(obj);
        return true;
    }
    if(this.children.length==0) {
        this.subdivide();
    }
    for(var i=0;i<4;i++) {
        if(this.children[i].insert(obj)) {
            return true;
        }
    }
    return false;
}

QuadTree.prototype.subdivide = function() {
    var r = this.boundary.radius / 2;
    var centers = [ new XY(this.boundary.center.x-r,this.boundary.center.y-r),
                    new XY(this.boundary.center.x+r,this.boundary.center.y-r),
                    new XY(this.boundary.center.x-r,this.boundary.center.y+r),
                    new XY(this.boundary.center.x+r,this.boundary.center.y+r) ];
    for(var i=0;i<centers.length;i++) {
        this.children.push(new QuadTree(new AABB(centers[i].r)));
    }
}

QuadTree.prototype.queryRange = function(boundary) {
    var pts = [];

    if(!this.boundary.intersectsAABB(boundary)) {
        return pts;
    }
    for(var i = 0; i < this.points.length; i++) {
        if(boundary.containsPoint(this.points[i].p)) {
            pts.push(this.points[i]);
        }
    }
    for(var i = 0; i < this.children.length; i++) {
        pts.push(...this.children[i].queryRange(boundary));
    }
    return pts;
}
