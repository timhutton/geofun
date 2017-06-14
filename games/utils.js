function postString(url,s) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(s);
}

function getString(source_url,callback) {
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
    client.get(source_url, callback);
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

function isLocalStorageAvailable() {
    var test = 'test';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

function readUsernameFromLocalStorage() {
    try {
        return localStorage.getItem("username");
    } catch(e) {
        console.log("Error getting localStorage:",e);
        return null;
    }
}

function writeUsernameToLocalStorage(username) {
    try {
        localStorage.setItem("username",username);
    } catch(e) {
        console.log("Error setting localStorage:",e);
        return false;
    }
}

function requestUsername(callback) {
    if(window.location.search) {
        // 1) specified in url?
        var username = window.location.search.substring(1);
        writeUsernameToLocalStorage(username);
        callback(username);
    }
    else {
        // 2) saved in localStorage?
        var username = readUsernameFromLocalStorage();
        if(username==null) {
            if(isLocalStorageAvailable()) {
                // 3) else if localStorage enabled, use a random string
                username = Math.random().toString(36).substring(7)
                writeUsernameToLocalStorage(username);
                callback(username);
            }
            else {
                // 4) else if localStorage blocked, request from server
                requestUsernameFromServer(function(s) { onUsernameReceived(s,callback); });
            }
        }
        else {
            callback(username);
        }
    }
}

function onUsernameReceived(s,callback) {
    var username = s.split('\n')[0];
    callback(username);
}

function requestUsernameFromServer(callback) {
    getString("https://geofun.org.uk/name",callback);
}
