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
