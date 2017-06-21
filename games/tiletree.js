// integer coordinates
function TileTree(x_min,y_min,num_x,num_y) {
    this.x_min = x_min;
    this.y_min = y_min;
    this.num_x = num_x;
    this.num_y = num_y;
    this.children = []; // empty or size 4: NW, NE, SW, SE
    this.updated = 0; // milliseconds since 1970
}

TileTree.prototype.isLeafNode = function() {
    return this.num_x * this.num_y == 1;
}

TileTree.prototype.subdivide = function() {
    var num_left = Math.floor(this.num_x / 2);
    var num_top = Math.floor(this.num_y / 2);
    var num_right = this.num_x - num_left;
    var num_bottom = this.num_y - num_top;
    if(num_left*num_top > 0) {
        this.children.push(new TileTree(this.x_min,this.y_min,num_left,num_top));
    }
    if(num_right*num_top > 0) {
        this.children.push(new TileTree(this.x_min+num_left,this.y_min,num_right,num_top));
    }
    if(num_left*num_bottom > 0) {
        this.children.push(new TileTree(this.x_min,this.y_min+num_top,num_left,num_bottom));
    }
    if(num_right*num_bottom > 0) {
        this.children.push(new TileTree(this.x_min+num_left,this.y_min+num_top,num_right,num_bottom));
    }
}

TileTree.prototype.setTile = function(ix,iy,color) {
    if( ix < this.x_min || ix >= this.x_min+this.num_x || iy < this.y_min || iy >= this.y_min+this.num_y ) {
        return false; // tile center is outside our region
    }
    if(this.isLeafNode()) {
        this.color = color;
        //this.updated = timenow; TODO
        return true;
    }
    if(this.children.length==0) {
        this.subdivide();
    }
    for(var i=0;i<this.children.length;i++) {
        if(this.children[i].setTile(ix,iy,color)) {
            // keep track of when any point in any child quad was updated
            //this.updated = Math.max(this.updated, obj.updated); TODO
            return true;
        }
    }
    console.log("Internal error in TileTree.");
}
