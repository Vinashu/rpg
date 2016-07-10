/**
 * Control lights.
 *
 * A light is anything with !Light as the first part of the GM Notes on the token.
 *
 * bar2 is considered to hold the duration of the light source, in minutes. Every
 * time the script is invoked (optionally, with a number of minutes), the duration
 * is reduced.
 *
 * At the end of their life, light sources reduce in luminosity until they go out.
 *
 * Magical sources (anything with 'Spell' in the token name) are constant brightness
 * right up to the end, then go out very quickly.
 *
 * Non-magical sources begin to decay towards the end, and then die out gradually
 * when the duration expires.
 */

// API COMMAND HANDLER
on("chat:message", function(msg) {
    if (msg.type !== "api") return;
    if (msg.content.split(" ", 1)[0] === "!lights") {
        var player_obj = getObj("player", msg.playerid);

        var commands = msg.content.split(" ");
        var duration = 1;
        if (commands.length > 1) {
            duration = commands[1];
        }

        var BOX_STYLE="background-color: #EEEE99; color: #000000; padding:0px; border:1px solid black; border-radius: 5px; padding: 5px";

        var message = "";
        if (duration < 1) {
            // Do nothing.
            return;
        } else if (duration == 1) {
            message = "1 minute passes.";
        } else {
            message = "" + duration + " minutes pass.";
        }
        sendChat("", "<div style='" + BOX_STYLE + "'>" + message + "</div>");

        var objects = findObjs({
            _pageid: Campaign().get("playerpageid"),
            _type: "graphic", _subtype: "token"
        });


        var count = 0;
        for (var i=0; i < objects.length; i++) {
            var obj = objects[i];
            var notes = obj.get("gmnotes");
            if (notes != null) {
                notes = unescape(notes);
                if (notes.indexOf("!Light") > -1) {
                    var max = obj.get("bar2_max");
                    var current = obj.get("bar2_value");

                    var lightRadius = obj.get("light_radius");
                    var dimRadius = obj.get("light_dimradius");

                    var spell = false;
                    if (obj.get("name").indexOf("Spell") > -1) {
                        spell = true;
                    }

                    for (var d=0; d < duration; d++) {

                        if (current == 0 && lightRadius == "" && dimRadius == "") {
                            // Nothing to do.
                            break;
                        } else if (current == 0 && lightRadius == 0 && dimRadius == 0) {
                            dimRadius = "";
                            lightRadius = "";
                        } else if (spell) {
                            // Spells decay at predicatable rate, and end quickly.
                            if (current == 0) {
                                lightRadius = Math.floor(lightRadius / 5);
                                dimRadius = 0;
                            } else {
                                current--;
                            }
                        } else {
                            // Natural light sources are less predictable.
                            if (current == 0) {
                                lightRadius -= 10;
                                dimRadius -= 10;
                                if (dimRadius < 0) {
                                    dimRadius = 0;
                                }
                                if (lightRadius < 0) {
                                    lightRadius = 0;
                                }
                            } else if (current < max / 3) {
                                if (dimRadius > current * 2) {
                                    dimRadius -= 2;
                                    lightRadius -= 1;
                                } else if (dimRadius > current && Math.random() < 0.5) {
                                    dimRadius -= 1;
                                }
                                current -= Math.floor(Math.random()*3);
                            } else {
                                current -= Math.floor(Math.random()*3);
                            }
                        }
                    }
                    obj.set({
                        bar2_value: current,
                        light_radius: lightRadius,
                        light_dimradius: dimRadius
                    });
                }
            }
        }
    }
});
