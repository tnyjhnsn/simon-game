var frequency = {
    0: 261.6,
    1: 392.0,
    2: 523.3,
    3: 587.3,
    4: 659.3
}

var soundWall = [
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 4]
]

var Location = function(row, col) {
    this.r = parseInt(row);
    this.c = parseInt(col);
}

var images = {
    0: ["http://www.spacetelescope.org", "Hubble Space Telescope"],
    1: ["https://s19.postimg.org/d5vmi6gkj/heic1501a.jpg", "NASA, ESA/Hubble and the Hubble Heritage Team"],
    2: ["https://s19.postimg.org/6gp325v8j/heic1509a.jpg", "NASA, ESA, the Hubble Heritage Team (STScI/AURA), A. Nota (ESA/STScI), and the Westerlund 2 Science Team"],
    3: ["https://s19.postimg.org/hhk876nhf/heic1608a.jpg", "NASA, ESA, Hubble Heritage Team"],
    4: ["https://s19.postimg.org/mu92lbbdv/heic0515a.jpg", "NASA, ESA and Allison Loll/Jeff Hester (Arizona State University). Acknowledgement: Davide De Martin (ESA/Hubble)"],
    5: ["https://s19.postimg.org/gulbhnqlf/heic0910h.jpg", "NASA, ESA and the Hubble SM4 ERO Team"],
    6: ["https://s19.postimg.org/pe4pfeyxv/heic0503a.jpg", "NASA, ESA, and The Hubble Heritage Team (AURA/STScI)"]
}

var difficulty = 0;
var status = "end";
var challenge = [];
var turnCounter = 0;
var responseCounter = 0;

var context = new (window.AudioContext || window.webkitAudioContext || false)();

if(!context) {
    alert("The audio used by this application is not supported in your browser."
        + "\nPlease consider downloading a recent version of Firefox or Chrome."
        + "\nThank you.");
}

function buildWall() {
    for (var row = 0; row < soundWall.length; row++) {
        for (var col = 0; col < soundWall[row].length; col++) {
            var html = '<div location="' + row + col + '" note="' + soundWall[row][col] + '" class="music"></div>'
            $("#sound-wall").append(html);
        }
    }
    $(".music").on("click", doResponse);
}

function setDifficulty() {
    difficulty = parseInt($("#difficulty").val());
    for (var row = 0; row < soundWall.length; row++) {
        for (var col = 0; col < soundWall[row].length; col++) {
            soundWall[row][col] = difficulty <= 2 ? col : getRandom();
        }
    }
    switch (difficulty) {
    case 0:
        var row = 2;
        for (var i = 0; i < 18; i++) {
            challenge.push(new Location(row, getRandom()));
        }
        break;
    case 1:
        var red = new Location(getRandom(), 0);
        var yellow = new Location(getRandom(), 1);
        var green = new Location(getRandom(), 2);
        var blue = new Location(getRandom(), 3);
        var violet = new Location(getRandom(), 4);
        var colours = [red, yellow, green, blue, violet];
        for (var i = 0; i < 15; i++) {
            challenge.push(colours[getRandom()]);
        }
        break;
    case 2: 
    case 3:
        for (var i = 0; i < 12; i++) {
            challenge.push(new Location(getRandom(), getRandom()));
        }
    }
}

function playChallenge() {
    status = "playing";
    if (turnCounter % 3 === 0) {
        setSpaceImage();
    }
    $("#counter").text((turnCounter + 1) + " / " + challenge.length);
    if (turnCounter === challenge.length) {
        $("#counter").text("Congratulations. You're a winner!");
        setTimeout(function() {
            endGame();
        }, 1000);
        return;
    }
    queueSounds(challenge, turnCounter);
}

function queueSounds(sounds, max) {
    var counter = 0;
    var interval = setInterval(function(){
        var sound = sounds[counter];
        var cell = $("#sound-wall").find('[location*="' + sound.r + sound.c + '"]');
        cellBright(cell);
        playNote(frequency[soundWall[sound.r][sound.c]]);
        if(counter === max) {
            status = "ready";
            clearInterval(interval);
        }
        counter++;
    }, 800);
}

function cellBright(cell) {
    cell.addClass("active");
    setTimeout(function() {
        cell.removeClass("active");
    }, 500);
}

function playNote(frequency, type) {
    var attack = 10;
    var release = 250;
    var volume = 0.75;
    var gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.setTargetAtTime(volume, context.currentTime, attack / 1000);
    gain.gain.setTargetAtTime(0, context.currentTime + attack / 1000, release / 1000);
    setTimeout(function() {
        osc.stop();
        osc.disconnect(gain);
    }, attack * 10 + release * 10);
    var osc = context.createOscillator();
    osc.frequency.setValueAtTime(frequency, context.currentTime);
    osc.type = type === undefined ? "sine" : type;
    osc.connect(gain);
    osc.start();
}

function getRandom() {
    return Math.floor(Math.random() * 5);
}

function checkResponse(location) {
    var challengeLoc = challenge[responseCounter];
    return (location.r === challengeLoc.r && location.c === challengeLoc.c);
}

function doResponse() {
    if (status !== "ready") return;
    var location = $(this).attr("location");
    var row = location.split("")[0];
    var col = location.split("")[1]
    if (checkResponse(new Location(row, col))) {
        playNote(frequency[$(this).attr("note")]);
        if (responseCounter === turnCounter) {
            turnCounter++;
            responseCounter = 0;
            playChallenge();
            return;
        }
        responseCounter++;
    } else {
        playNote(200.0, "sawtooth");
        var strictMode = $("#strict-mode").is(":checked") ? true : false;
        turnCounter = strictMode ? 0 : turnCounter;
        responseCounter = 0;
        playChallenge();
    }
}

function setSpaceImage() {
    var rand = Math.floor((Math.random() * 6) + 1)
    var credit = images[rand][1] + '<br /><a href="' + images[0][0] +
        '" target="_blank">' + images[0][1] + '</a>';
    $("#telescope img").attr("src", images[rand][0]);
    $("#telescope img").fadeIn(500);
    $("#img-credit").html(credit);
} 

function playDemo() {
    var sounds = [
        new Location(getRandom(), 3),
        new Location(getRandom(), 4),
        new Location(getRandom(), 2),
        new Location(getRandom(), 0),
        new Location(getRandom(), 1)
    ];
    status = "demo";
    queueSounds(sounds, sounds.length - 1);
}

function startGame() {
    $(".music").off("click");
    $("#settings").hide("slow");
    $("#counter").show("slow");
    $("#reset").show("slow");
    $("#ce-demo").hide("slow");
    setDifficulty();
    $("#sound-wall").empty();
    buildWall();
    playChallenge();
}

function endGame() {
    status = "end";
    $("#counter").hide("slow");
    $("#reset").hide("slow");
    $("#ce-demo").show("slow");
    $("#settings").show("slow");
    $("#sound-wall").empty();
    buildWall();
    turnCounter = 0;
    responseCounter = 0;
    challenge = [];
    $(".music").off("click");
    $(".music").on("click", function() {
        playNote(frequency[$(this).attr("note")]);
    });
}

$(document).ready(function() {
    endGame();
    setSpaceImage();
    $("#go-toggle").on("click", function() {
        startGame();
    });
    $("#ce-demo").on("click", function() {
        playDemo();
    })
    $("#reset").on("click", function() {
        endGame();
    })
});
