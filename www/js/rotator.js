jQuery.ajaxSetup({
    cache: true
});

function clone_object(ob) {
    return JSON.parse(JSON.stringify(ob));
}

function Rotator(currency) {
    var rotator = this;
    this.possible = 0;
    this.current = null;
    this.currency = null;
    this.interval = null;
    this.limit = null;
    this.restartInterval = null;
    this.faucets = {};
    $("<script src='https://static.faucetbox.com/scanthebox/currencies.js'></script>").appendTo($("head"));
    if (!localStorage["broken"])
        localStorage["broken"] = "[]";
    try {
        window.frames[0].alert = function() {};
        window.frames[0].prompt = function() {};
    } catch (err) {}
    var initCurrencies = function() {
        if (typeof currencies != "undefined") {
            $.each(currencies, function(k, v) {
                if (v["count"] > 0) {
                    UI.addCurrency(k, v);
                }
            });
        } else {
            setTimeout(initCurrencies, 100);
        }
    };
    initCurrencies();
}
Rotator.prototype.finish = function() {
    this.current = null;
    UI.finish();
    this.watchRestart();
};
Rotator.prototype.rotate = function(currency) {
    var rotator = this;
    if (this.restartInterval !== null) {
        clearInterval(this.restartInterval);
        this.restartInterval = null;
    }
    if (currency) {
        this.currency = currency;
    }
    UI.setCurrency(this.currency);
    if (typeof faucets[this.currency] == 'undefined')
        $("<script src='https://static.faucetbox.com/scanthebox/"+this.currency+".js'></script>").appendTo($("head"));
    var startIt = function() {
        if (typeof faucets[rotator.currency] != "undefined") {
            if (rotator.recalculate()) {
                UI.rotate();
                rotator.next();
            } else {
                rotator.finish();
            }
            if (rotator.interval == null)
                rotator.interval = setInterval(function() {
                    rotator.recalculate();
                }, 1000);
        } else {
            setTimeout(startIt, 100);
        }
    };
    startIt();
};
Rotator.prototype.getFaucetsList = function() {
    if (!this.currency) {
        return {
            "faucets": [],
            "unit": ""
        };
    }
    var flist = clone_object(faucets[this.currency]);
    var broken = JSON.parse(localStorage['broken']);
    var limit = rotator.limit;
    if (limit) {
        flist.sort(function(a, b) {
            if (($.inArray(a['url'], broken) > -1) != ($.inArray(b['url'], broken) > -1)) {
                if ($.inArray(a['url'], broken) > -1)
                    return 1;
                else
                    return -1;
            }
            return b['avg'] - a['avg'];
        });
    }
    $.each(flist, function(i, v) {
        if (limit && i < limit)
            v['inlimit'] = 1;
        else
            v['inlimit'] = 0;
    });
    flist.sort(function(a, b) {
        if (a['inlimit'] != b['inlimit'])
            return b['inlimit'] - a['inlimit'];
        if (($.inArray(a['url'], broken) > -1) != ($.inArray(b['url'], broken) > -1)) {
            if ($.inArray(a['url'], broken) > -1)
                return 1;
            else
                return -1;
        }
        if (a['time_left'] - b['time_left'] != 0)
            return a['time_left'] - b['time_left'];
        return b['avg'] - a['avg'];
    });
    return {
        "faucets": flist,
        "unit": currencies[this.currency]['unit']
    };
}
Rotator.prototype.watchRestart = function() {
    if (this.restartInterval !== null) return;
    var rotator = this;
    UI.manageLeftTimer();
    this.restartInterval = setInterval(function() {
        if (rotator.recalculate()) {
            rotator.rotate();
            UI.beep();
        } else {
            UI.reloadTable();
        }
        UI.manageLeftTimer();
    }, 30 * 1000);
};
Rotator.prototype.recalculate = function() {
    var rotator = this;
    this.possible = 0;
    now = Date.now();
    if (!localStorage["broken"])
        localStorage["broken"] = "[]";
    for (var i = 0; i < faucets[this.currency].length; i++) {
        var last_visited = 0;
        if (localStorage[faucets[this.currency][i]["url"]])
            last_visited = parseInt(localStorage[faucets[this.currency][i]["url"]])-65;
        var passed = Math.round((now - last_visited) / 1000 / 60);
        var left = parseInt(faucets[this.currency][i]["timer"]) - passed;
        if (left < 0)
            left = 0;
        faucets[this.currency][i]["time_left"] = left;
    }
    var broken = JSON.parse(localStorage["broken"]);
    var l = faucets[this.currency].length;
    if (this.limit && this.limit < l) {
        l = this.limit;
        faucets[this.currency].sort(function(a, b) {
            if (($.inArray(a['url'], broken) > -1) != ($.inArray(b['url'], broken) > -1)) {
                if ($.inArray(a['url'], broken) > -1)
                    return 1;
                else
                    return -1;
            }
            return b["avg"] - a["avg"];
        });
    }
    this.faucets[this.currency] = [];
    for (var i = 0; i < l; i++) {
        if ($.inArray(faucets[this.currency][i]["url"], broken) == -1) {
            if (faucets[this.currency][i]['time_left'] == 0)
                this.possible += 1;
            this.faucets[this.currency].push(clone_object(faucets[this.currency][i]));
        }
    }
    this.faucets[this.currency].sort(function(a, b) {
        if (a["time_left"] - b["time_left"] != 0) {
            return a["time_left"] - b["time_left"];
        }
        return b["avg"] - a["avg"];
    });
    UI.setLeft(this.possible);
    return this.possible > 0;
};
Rotator.prototype.next = function() {
    UI.blockButtons();
    if (this.current !== null)
        localStorage[this.current] = Date.now();
    if (this.recalculate()) {
        console.log('Loading ' + this.faucets[this.currency][0]["url"]);
        UI.setCurrentFaucet(this.faucets[this.currency][0]["name"]);
        UI.iframeLoad(this.faucets[this.currency][0]["url"]);
        this.current = this.faucets[this.currency][0]["url"];
    } else {
        this.finish();
    }
};
Rotator.prototype.setLimit = function(limit) {
    this.limit = limit;
    localStorage['limit'] = this.limit;
    if (this.currency) {
        if (this.recalculate()) {
            if (!this.current && this.currency)
                rotator.rotate();
        } else {
            this.finish();
        }
        UI.reloadTable();
    }
};
Rotator.prototype.isBroken = function(url) {
    var broken = JSON.parse(localStorage["broken"]);
    return broken.indexOf(url) > -1;
};
Rotator.prototype.broken = function(url) {
    if (!url)
        url = this.current;
    if (url == this.current)
        this.next();
    var broken = JSON.parse(localStorage["broken"]);
    broken.push(url);
    localStorage["broken"] = JSON.stringify(broken);
    this.recalculate();
};
Rotator.prototype.restore = function(url) {
    var broken = JSON.parse(localStorage["broken"]);
    var index = broken.indexOf(url);
    if (index > -1)
        broken.splice(index, 1);
    localStorage["broken"] = JSON.stringify(broken);
    this.recalculate();
};
