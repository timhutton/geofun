function postString(url,s) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(s);
    if(console_debug)
        console.log('Sent:',s);
}

function addButton(label,desc,func,map) {
    var button = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function (map) {
        var container = L.DomUtil.create('input','leaflet-control-button');
        container.type  = "button";
        container.title = desc;
        container.value = label;
        container.label = label;

        container.style.backgroundColor = 'white';
        container.style.width = '30px';
        container.style.height = '30px';
        container.onclick = func;
        container.onmouseover = function(){
          container.style.backgroundColor = 'WhiteSmoke';
        }
        container.onmouseout = function(){
          container.style.backgroundColor = 'white';
        }
        return container;
      },
    });
    map.addControl(new button());
}

function getDistanceAsString(m) {
    if(m >= 1000) {
        var km = m/1000;
        return km.toFixed(0)+"km";
    }
    else {
        return m.toFixed(0)+"m";
    }
}