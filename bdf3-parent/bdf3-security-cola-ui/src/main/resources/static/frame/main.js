(function () {
    cola(function (model) {
        var errorCount, longPollingTimeOut;

        var service = {
            messagePull: messagePullPath,
            messageTotalPull: messageTotalPullPath,
            loadMenus: "./service/menus",
            getLoginUser: "./service/user/detail"
        };
        model.set("searching", false);
        model.describe("menus", {
            provider: {
                url: service.loadMenus
            }
        });

        model.describe("loginUser", {
            provider: {
                url: service.getLoginUser
            }
        });

        model.get("menus", function(menus) {
            var urls, parseMenus, temp, children, path, current;
            urls = [];
            if (window.location.hash) {
                path = window.location.hash.substring(1);
            }
            parseMenus = function(menus, level) {
                if (menus) {
                    menus.each(function(menu) {
                        temp = menu.toJSON({simpleValue: true});
                        temp.level = level;
                        temp.hasChild = false;
                        urls.push(temp);
                        children = menu.get("children");
                        if (path === menu.get("path") && !current) {
                            current = menu;
                        }
                        if (children && children.entityCount > 0) {
                            temp.hasChild = true;
                            menu.set("hasChild", true);
                            parseMenus(menu.get("children"), level + 1);
                        }
                    });
                }
            };
            parseMenus(menus, 0);
            model.set("allUrls", urls);
            model.set("urls", urls);
            model.action("expandAndOpenPage")(current);

            if ($.cookie('switchBarExpand') === "true") {
                model.action("switchBar")();
            }
        });


        model.action({
            openUserCenter: function() {
                $("#userCenter").sidebar("toggle");
            },
            searchUrl: function () {
                var searchKey, result, name, desc, url;
                searchKey = model.get("searchUrlKey");
                model.set("urls", []);
                result = model.get("urls");
                model.get("allUrls", function(urls) {
                    var processUrls = function(urls) {
                        if (!urls) return;
                        urls.each(function(u) {
                            name = u.get("name");
                            desc = u.get("description");
                            if (name && name.indexOf(searchKey) !== -1) {
                                url = result.insert(u.toJSON({
                                    simpleValue: true
                                }));
                            }
                        });
                    };
                    if (searchKey) {
                        model.set("searching", true);
                        processUrls(urls);
                    } else {
                        model.set("searching", false);
                        model.set("urls", model.get("allUrls").toJSON());
                    }
                });

            },
            showMenuBar: function() {
                var menu, width, switchBar;
                menu = $("#menuWrapper");
                switchBar = $("#switchBar .icon");
                if (switchBar.hasClass("rotated")) {
                    width = "184px";
                } else {
                    width ="54px";
                }
                if (menu.width() === 0) {
                    menu.animate({width: "+=" + width}, "fast");
                    $("#main").animate({
                        "padding-left": width
                    }, "fast");
                } else {
                    menu.animate({width: "-=" + width}, "fast");
                    $("#main").animate({
                        "padding-left": "0px"
                    }, "fast");
                }
            },
            switchBar: function() {
                var switchBar, menu;
                switchBar = $("#switchBar .icon");
                menu = $("#menuWrapper");
                if (menu.width() === 0) return;
                if (switchBar.hasClass("rotated")) {
                    switchBar.removeClass("rotated");
                    menu.animate({width: "-=130px"}, "fast");
                    switchBar.parent().removeClass("expand").animate({width: "54px"}, "fast");
                    $("#main").animate({
                        "padding-left": "54px"
                    }, "fast");
                    $.cookie('switchBarExpand', false, { expires: 10000000 });
                } else {
                    switchBar.addClass("rotated");
                    menu.animate({width: "+=130px"}, "fast");
                    switchBar.parent().addClass("expand").animate({width: "184px"}, "fast");
                    $("#main").animate({
                        "padding-left": "184px"
                    }, "fast");
                    $.cookie('switchBarExpand', true, { expires: 10000000 });
                }
            },
            refreshPage: function() {
                var url, iframe;
                url = model.get("currentUrl");
                if (url && url.get("path")) {
                    iframe = $("#url_" + url.get("id"));
                    iframe.attr("src", url.get("path"));
                }
            },
            expandAndOpenPage: function(current) {
                var expandPath;
                if (!current) return;
                if (typeof current === "string") {
                    model.get("urls").each(function(url) {
                        if (url.get("path") === current || url.get("name") === current) {
                            current = url;
                            return false;
                        }
                    });
                }
                if (current instanceof cola.Entity) {
                    expandPath = function(url) {
                        if (url && url.parent.parent.parent) {
                            expandPath(url.parent.parent);
                        }
                        model.action("expandChildren")(url);
                    };
                    expandPath(current);
                    model.action("openPage")(current);
                } else {
                    model.action("openPage")(current);
                }

            },
            openPage: function(url) {
                var iframe, active;
                if (!url) return;
                if (typeof url === "string") {
                   url = {
                       id: url,
                       name: url,
                       path: url
                   };
                }
                model.set("currentUrl", url);
                url = model.get("currentUrl");
                if (url.get("path")) {
                    iframe = $("#url_" + url.get("id"));
                    active = $("#main > .active");

                    if (iframe.length > 0) {
                        if (active.attr("id") !== iframe.attr("id")) {
                            active.removeClass("active").hide();
                            iframe.addClass("active").show();
                        }

                    } else {
                        active.removeClass("active").hide();
                        iframe = $('<iframe class="active" allowtransparency="true" frameborder="0" scrolling="0" width="100%" height="100%"></iframe>')
                            .prop({
                                src: url.get("path"),
                                id: "url_" + url.get("id")

                            });

                        iframe.appendTo("#main");
                    }
                }
                $("#menu > .item.active").removeClass("active");
                $("#menu > .item[my-id='"+ url.get("id") +"']").addClass("active");
                if (url.get("path")) {
                    window.location.hash = "#" + url.get("path");
                }
            },
            menuItemClick: function(url) {
                model.action("openPage")(url);
                model.action("toggleChildren")(url);

            },
            expandChildren: function(url) {
                var icon, current;
                current = $("#menu > .item[my-id='"+ url.get("id") +"']");
                icon = current.find(".icon");
                if (!icon.hasClass("rotated")) {
                    model.action("toggleChildren")(url);
                }

            },
            toggleChildren: function(url) {
                var findChildren, children, urlId, current, icon;
                children = [];
                current = $("#menu > .item[my-id='"+ url.get("id") +"']");

                if (url.get("hasChild")) {
                    findChildren = function($url) {
                        urlId = $url.attr("my-id");
                        $("#menu > .item[parent-id='"+ urlId +"']").each(function() {
                            children.push(this);
                            if ($(this).is(":has(.rotated)")) {
                                findChildren($(this));
                            }
                        });

                    };
                    icon = current.find(".icon");
                    findChildren(current);
                    if (icon.hasClass("rotated")) {
                        $(children).transition({
                            animation : 'scale',
                            interval  : 50
                        });
                        icon.removeClass("rotated");
                    } else {
                        $(children).transition({
                            animation : 'pulse',
                            reverse  : "auto",
                            interval  : 50,
                            displayType: "block"
                        });
                        icon.addClass("rotated");
                    }


                }
            }
        });

        errorCount = 0;
        longPollingTimeOut = null;
        window.refreshMessage = function() {
            var options;
            options = {};
            if (longPollingTimeOut) {
                clearTimeout(longPollingTimeOut);
            }
            if (longPollingTimeout) {
                options.timeout = longPollingTimeout;
            }
            return $.ajax(service.messageTotalPull, options).done(function(messageTotal) {
                model.set("messageTotal", messageTotal);
                if (messageTotal > 0) {
                    $("#messageTotal").css("display", "inline-block").text(messageTotal > 100 ? "99+" : messageTotal);
                } else {
                    $("#messageTotal").css("display", "none");
                }

                if (liveMessage) {
                    return longPollingTimeOut = setTimeout(refreshMessage, longPollingInterval);
                }
            }).error(function(xhr, status, ex) {
                if (liveMessage) {
                    if (status === "timeout") {
                        return longPollingTimeOut = setTimeout(refreshMessage, longPollingInterval);
                    } else {
                        errorCount++;
                        return longPollingTimeOut = setTimeout(refreshMessage, 5000 * Math.pow(2, Math.min(6, errorCount - 1)));
                    }
                }
            });
        };
        if (!messageDisabled) {
            longPollingTimeOut = setTimeout(refreshMessage, 1000);
            refreshMessage();
        }

        window.openPage = model.action("openPage");
        
        window.refreshPage = model.action("refreshPage");

        window.expandAndOpenPage = model.action("expandAndOpenPage");

    });

}).call(this);
