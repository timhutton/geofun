// integer coordinates
function TileTree(x_min,y_min,num_x,num_y) {
    this.x_min = x_min;
    this.y_min = y_min;
    this.num_x = num_x;
    this.num_y = num_y;
    this.children = []; // empty or size 4: NW, NE, SW, SE
    this.updated = 0; // milliseconds since 1970
    this.has_tile = false;
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

TileTree.prototype.setTile = function(ix,iy,color,time) {
    if( ix < this.x_min || ix >= this.x_min+this.num_x || iy < this.y_min || iy >= this.y_min+this.num_y ) {
        return false; // tile center is outside our region
    }
    if(this.isLeafNode()) {
        this.color = color;
        this.has_tile = true;
        this.updated = time;
        return true;
    }
    if(this.children.length==0) {
        this.subdivide();
    }
    for(var i=0;i<this.children.length;i++) {
        if(this.children[i].setTile(ix,iy,color,time)) {
            // keep track of when any point in any child quad was updated
            this.updated = time;
            return true;
        }
    }
    console.log("Internal error in TileTree.setTile()");
}

TileTree.prototype.getTilesChangedSince = function(time) {
    // return the tiles in this quad modified since the time given, if not too many
    // TODO: time integral to give quick "too many"
    var TOO_MANY = 100;
    if( time > this.updated ) {
        return { too_many:false, tiles:[] }; // nothing modified since the time given
    }
    if(this.isLeafNode()) {
        if(this.has_tile) {
            return { too_many:false, tiles:[this.getTile()]}; // leaf node with a tile
        }
        else {
            return { too_many:false, tiles:[] }; // empty leaf node
        }
    }
    var tiles = [];
    for(var i=0;i<this.children.length;i++) {
        var child_tiles = this.children[i].getTilesChangedSince(time);
        if(child_tiles.too_many || tiles.length+child_tiles.tiles.length > TOO_MANY) {
            return { too_many:true, tiles:[] }; // too many tiles to send
        }
        tiles.push(...child_tiles.tiles);
    }
    return {too_many:false, tiles:tiles}; // sensible number of tiles to send
}

TileTree.prototype.getTile = function() {
    return { aabb:new AABB(new XY(this.x_min,this.y_min),0.5,0.5), color:this.color };
}

TileTree.prototype.getTileAABB = function() {
    return new AABB(new XY(this.x_min,this.y_min),0.5,0.5);
}

TileTree.prototype.debugGetAllTiles = function() {
    var tiles = [];
    if(this.isLeafNode() && this.has_tile) {
        tiles.push(this.getTile());
    }
    for(var i = 0; i < this.children.length; i++) {
        tiles.push(...this.children[i].debugGetAllTiles());
    }
    return tiles;
}

TileTree.prototype.debugGetAllQuads = function() {
    var quads = [];
    quads.push(new AABB(new XY(this.x_min+this.num_x/2-0.5,this.y_min+this.num_y/2-0.5),this.num_x/2,this.num_y/2));
    for(var i = 0; i < this.children.length; i++) {
        quads.push(...this.children[i].debugGetAllQuads());
    }
    return quads;
}
