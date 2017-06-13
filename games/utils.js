function postString(url,s) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(s);
    console.log('Sent:',s);
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

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

function readUsernameFromCookie() {
    username = readCookie("username"); // might be undefined
}

function writeUsernameToCookie() {
    createCookie("username",username); // no expiry
}

function getUsername() {
    if(window.location.search) {
        // specified in url?
        username = window.location.search.substring(1);
        writeUsernameToCookie();
        console.log("Username read from url:",username);
    }
    else {
        // saved in cookie?
        readUsernameFromCookie();
        if(username==null) {
            // request from server
            requestUsernameFromServer(onUsernameReceived);
            // use a random string for now
            username = Math.random().toString(36).substring(7)
            writeUsernameToCookie(username);
            console.log("Username created as random string:",username);
        }
        else {
            console.log("Username read from cookie:",username);
        }
    }
}

function onUsernameReceived(s) {
    console.log("Username received from server:",s);
    username = s;
    writeUsernameToCookie();
}

function requestUsernameFromServer() {
    getString("https://geofun.org.uk/name",onUsernameReceived);
}
