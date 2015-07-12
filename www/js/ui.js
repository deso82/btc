var rotator = null;
UI = {
    title: "ScanTheBOX.com - Official FaucetBOX.com Faucets Rotator",
    init: function() {
        rotator = new Rotator();
        $("#cookie-info").alert();
        $("#cookie-info").on("closed.bs.alert", function() {
            localStorage["cookie-info"] = "true";
        });
        if (localStorage["cookie-info"] == "true") {
            $("#cookie-info").alert('close');
        }
        $("#link-change-currency").click(function() {
            UI.showPage('home');
            return false;
        });
        $("#sidebar .sidebar-brand a, #sidebar .sidebar-brand-toggled a").click(function() {
            UI.showPage('home');
            return false;
        });
        $("#link-home").click(function() {
            UI.showPage('home');
            return false;
        });
        $("#link-list").click(function() {
            if (!$(this).hasClass('disabled')) {
                UI.reloadTable();
                UI.showPage('list');
            }
            return false;
        });
        $("#link-change-limit").click(function() {
            UI.showSideBar();
        });
        $("#link-wait").click(function() {
            return false;
            UI.reloadTable();
            UI.showPage('wait');
            return false;
        });
        $("#link-report").click(function() {
            UI.showSideBar();
            if (!$(this).hasClass('disabled'))
                $("#report-confirm").show();
            return false;
        });
        $("#btn-report-yes").click(function(e) {
            e.stopPropagation();
            $("#report-confirm").hide();
            rotator.broken();
        });
        $("#btn-report-cancel").click(function(e) {
            e.stopPropagation();
            $("#report-confirm").hide();
        });
        $("#test-sound").click(function() {
            UI.beep(true);
            return false;
        });
        $("#beep").prop('checked', localStorage["play-sounds"] == "true").change(function() {
            localStorage["play-sounds"] = $(this).prop('checked');
            UI.beep();
        });
        $(".control-next").click(function() {
            if ($(this).hasClass("disabled")) return;
            rotator.next();
        });
        $("#limit").change(function() {
            rotator.setLimit($(this).val());
        });
        $("#broken").click(function() {
            rotator.broken();
        });
        $(".control-stop").click(function() {
            if ($(this).hasClass("disabled")) return;
            UI.reloadTable();
            UI.showPage('list');
        });
        $(".control-continue").click(function() {
            if ($(this).hasClass("disabled")) return;
            UI.showPage('iframe');
        });
        if (localStorage['limit']) {
            $("#limit").val(localStorage['limit']).change();
        }
        $("#link-toggle-menu").click(function() {
            if ($("#wrapper").hasClass("toggled"))
                UI.showSideBar();
            else
                UI.hideSideBar();
        });
        var initCurrencies = function() {
            if (typeof currencies != "undefined") {
                var cand = window.location.hash.substr(1).toUpperCase();
                if (typeof currencies[cand] != 'undefined') {
                    rotator.rotate(cand);
                    UI.reloadTable();
                    UI.showPage('list');
                }
            } else {
                setTimeout(initCurrencies, 100);
            }
        };
        initCurrencies();
    },
    hideSideBar: function() {
        if (!$("#wrapper").hasClass("toggled"))
            $("#wrapper").addClass("toggled");
        $("#link-toggle-menu .left").hide();
        $("#link-toggle-menu .right").show();
    },
    showSideBar: function() {
        $("#wrapper").removeClass("toggled");
        $("#link-toggle-menu .left").show();
        $("#link-toggle-menu .right").hide();
    },
    showPage: function(name) {
        $("#report-confirm").hide();
        $(".row").hide();
        $("button.control").hide();
        $("a.control").addClass('disabled');
        $("#link-report").addClass('disabled');
        $("#link-list").removeClass('disabled');
        if (!rotator.currency)
            $("#link-list").addClass('disabled');
        switch (name) {
            case 'home':
                if (rotator.current) {
                    $("button.control-continue").show();
                    $("a.control-continue").removeClass("disabled");
                }
                $("#row-start").show();
                $("#row-currencies").show();
                break;
            case 'privacy':
                if (rotator.current) {
                    $("button.control-continue").show();
                    $("a.control-continue").removeClass("disabled");
                }
                $("#row-privacy").show();
                $("#row-currencies").show();
                break;
            case 'list':
                $("#row-currencies").show();
                $("#row-list").show();
                $("button.control-continue").show();
                $("a.control-continue").removeClass("disabled");
                break;
            case 'wait':
                $("#link-list").addClass('disabled');
                $("#row-currencies").show();
                $("#row-list").show();
                $("#row-wait").show();
                break;
            case 'iframe':
                $("#row-iframe").show();
                $("button.control-stop").show();
                $("button.control-next").show();
                $("a.control-stop").removeClass("disabled");
                $("a.control-next").removeClass("disabled");
                $("#link-report").removeClass('disabled');
                break;
        }
    },
    setCurrency: function(currency) {
        $("#currency").text(currency);
        $("#link-change-currency").show();
    },
    setCurrentFaucet: function(faucet) {
        $("#current-faucet").text(faucet);
        $("#current-faucet").attr('title', faucet);
    },
    beep: function(force) {
        if (force || $("#beep").prop('checked'))
            UI.audio.play();
    },
    iframeLoad: function(src) {
        $("#iframe").attr('src', src);
    },
    blockButtons: function() {
        $('.control-next').prop('disabled', true);
        setTimeout(function() {
            $('.control-next').prop('disabled', false);
        }, 3000);
    },
    addCurrency: function(k, v) {
        $("#currency-list").append($("<div>").addClass("btn").addClass("btn-primary").text(v["name"] + " ").append($("<span>").addClass('badge').text(v["count"])).click(function() {
            rotator.rotate(k);
        }));
    },
    finish: function() {
        UI.setCurrentFaucet('---');
        UI.reloadTable();
        UI.showPage('wait');
    },
    rotate: function() {
        UI.showPage('iframe');
        $(".control-next").prop('disabled', false);
    },
    reloadTable: function() {
        var faucets = rotator.getFaucetsList();
        var unit = faucets["unit"];
        var faucets = faucets["faucets"];
        var table = $("#list-table tbody");
        table.empty();
        if (faucets.length == 0) {
            table.append($("<tr colspan=5>").append($("<td>").text("Select currency first!")));
            return;
        }
        $.each(faucets, function(i, faucet) {
            var tr = $("<tr/>");
            if (i == rotator.limit - 1)
                tr.addClass('limit-end');
            var btn = $("<span/>").addClass('btn').addClass('btn-xs').data('faucet', faucet['url']);
            if (rotator.isBroken(faucet['url'])) {
                tr.addClass('disabled');
                btn.text('Enable').addClass('btn-success').data('status', 'disabled');
            } else {
                btn.text('Disable').addClass('btn-danger').data('status', 'enabled');
            }
            btn.click(function() {
                if ($(this).data('status') == 'enabled') {
                    rotator.broken($(this).data('faucet'));
                    UI.reloadTable();
                } else {
                    rotator.restore($(this).data('faucet'));
                    UI.reloadTable();
                }
            });
            var link = $("<a>").attr("href", faucet["url"]).attr("target", "_blank").text(faucet["name"]);
            var label = '';
            if (faucet["hot"]) {
                label += ' <span class="label label-danger hot-faucet">HOT</span>';
            }
            if (faucet["new"]) {
                label += ' <span class="label label-success new-faucet">NEW</span>';
            }
            if (faucet["golden"]) {
                tr.addClass("golden");
            }
            tr.append($("<td/>").text((i + 1) + "."));
            tr.append($("<td/>").append(link).append(label));
            tr.append($("<td/>").html(faucet["time_left"] + " <span>minutes</span>"));
            tr.append($("<td/>").text(faucet["max"] + " " + unit));
            tr.append($("<td/>").text(faucet["avg"] + " " + unit));
            tr.append($("<td/>").append(btn));
            tr.appendTo(table);
        });
    },
    manageLeftTimer: function() {
        var faucets = rotator.getFaucetsList();
        var timeLeft = faucets["faucets"][0]["time_left"];
        if (timeLeft > 0) {
            document.title = "(" + timeLeft + "m) " + UI.title;
        } else {
            document.title = UI.title;
        }
    },
    setLeft: function(l) {
        if (l < 0)
            l = 0;
        $("#left").text(l);
    },
    audio: $("<audio src='beep.wav' preload='auto'>")[0]
}
$(function() {
    UI.init();
});
