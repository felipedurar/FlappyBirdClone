// Events Listeners
window.addEventListener("load", Init);

// Sprites
var ground = null;
var pipe = null;
var bird = null;

// Sounds
var sfx_wing = null;
var sfx_point = null;
var sfx_hit = null;
var sfx_die = null;
var sfx_swooshing = null;

// Deafault Viewport Size
var W = 400;
var H = 600;

// Vars
var status = 0; // 0 = Start Screen / 1 = Gaming / 2 = Game Over
var score = 0;
var groundStep = 0;
var scroolingSpeed = 3;
var lockScroll = false;
var lockJump = false;
var lockBird = true;

// Score Room
var newBest = false;
var bestScore = 0;

// Bird
var xPos = 10; // This is a constant value!
var yPos = 250;
var yGravity = 0;
var yGravityIncreaser = 2;
var yJumpGravity = -17;
var yMaxGravity = 20;
var birdDrawScale = 6; // size/scale
var hitTheGround = false;

function Pipe() {
    this.X = 0;
    this.H = 10;
    this.Marker = false;
}

var Pipes = [];
var nPipes = 3;
var PipesDistanceX = 150; // X Dist
var PipesDistanceY = 130;
var PipeScale = 2;
// var PipeSpeed = 2;  // The pipe speed need to be equal the scrooling speed

function InitPipes() {
    var xCounter = W;
    for (var i = 0; i < nPipes; i++) {
        var sPipe = new Pipe();
        sPipe.X = xCounter;
        sPipe.H = Math.floor((Math.random() * (H - (ground.height + PipesDistanceY + 50))) + 50);
        sPipe.Marker = false;
        xCounter += PipesDistanceX + (pipe.width / PipeScale);
        Pipes.push(sPipe);
    }
}

function Init() {
    // Get the canvas element
    var canvas = document.getElementById("CTX");

    // Set the canvas size
    canvas.setAttribute("width", W);
    canvas.setAttribute("height", H);

    // Get canvas context
    var ctx = canvas.getContext("2d");

    // Load Media
    ground = new Image();
    ground.src = "./sprites/ground.png";
    pipe = new Image();
    pipe.src = "./sprites/pipe.png";
    bird = new Image();
    bird.src = "./sprites/bird.png";

    sfx_wing = new Audio("./audio/sfx_wing.ogg");
    sfx_point = new Audio("./audio/sfx_point.ogg");
    sfx_hit = new Audio("./audio/sfx_hit.ogg");
    sfx_die = new Audio("./audio/sfx_die.ogg");
    sfx_swooshing = new Audio("./audio/sfx_swooshing.ogg");

    // Init pipes
    // Used here for test :D
    // InitPipes();

    // Key events
    document.addEventListener("keydown", function (e) {
        if (e.keyCode == 32) // Space Button
        {
            if (!lockJump) {
                yGravity = yJumpGravity;
            }
            if (status == 0) // Start Room
            {
                startGame();
            }
            if (status == 2) // Game Over State
            {
                if (sfx_swooshing != null) {
                    sfx_swooshing.play();
                }
                //
                reset();
            }
            if (sfx_wing != null && status == 1) {
                sfx_wing.pause();
                sfx_wing.currentTime = 0;
                //
                sfx_wing.play();
            }
        }
    }, false);

    // Create a loop. 30 ms interval
    var interval = window.setInterval(function () {
        GUpdate(ctx, canvas);
    }, 30);

}

// Move the ground
function doGroundStep() {
    if (ground != null) {
        groundStep += scroolingSpeed;
        if (groundStep >= ground.width) {
            groundStep = 0;
        }
    }
}

function updateGravity() {
    yGravity += yGravityIncreaser;
    if (yGravity > yMaxGravity) {
        yGravity = yMaxGravity;
    }
}

function updateBirdPosition() {
    yPos += yGravity;
    if (yPos < 0) {
        yPos = 0;
    }
    if (yPos > (H - ground.height) - (bird.height / birdDrawScale)) {
        yPos = (H - ground.height) - (bird.height / birdDrawScale);

        // Another Colision Case
        gameOver();

        if (!hitTheGround) {
            sfx_die.play();
            //
            hitTheGround = true;
        }
    }
}

// Get the farest pipes X position
function getFarestPipeX() {
    var farestX = 0;
    for (var i in Pipes) {
        if (Pipes[i].X > farestX) {
            farestX = Pipes[i].X;
        }
    }
    //
    return farestX;
}

function updatePipesPosition() {
    for (var i in Pipes) {
        Pipes[i].X -= scroolingSpeed;
        if (Pipes[i].X + (pipe.width / PipeScale) < 0) {
            Pipes[i].X = getFarestPipeX() + (pipe.width / PipeScale) + PipesDistanceX; // The most far pipe!
            Pipes[i].H = Math.floor((Math.random() * (H - (ground.height + PipesDistanceY + 50))) + 50); // Get the new Height
            Pipes[i].Marker = false;
        }
    }
}

function getGravityPercentValue() {
    var yMax = yMaxGravity + (yJumpGravity * (-1));
    var yGravityTmp = yGravity + (yJumpGravity * (-1));
    //
    return (yGravityTmp * 100) / yMax;
}

// get the distance between two points
function Magnitude(p1, p2) {
    return Math.sqrt(Math.pow(p2.X - p1.X, 2) + Math.pow(p2.Y - p1.Y, 2));
}

// Test collision between a circle and a rectangle
// circle { R: Radius, X: X, Y: Y }
// rect { X: X, Y: Y, W: Width, H: Height }
function CircleRectangleCollision(circle, rect) {
    // Test if the circle is at the corners
    // Corner Up-Left
    if (circle.X + circle.R < rect.X && circle.Y + circle.R < rect.Y) {
        if (Magnitude({ X: circle.X, Y: circle.Y }, { X: rect.X, Y: rect.Y }) <= circle.R) {
            return true;
        }
        else {
            return false;
        }
    }
    // Corner Up-Right
    if (circle.X > rect.X + rect.W && circle.Y < rect.Y) {
        if (Magnitude({ X: circle.X, Y: circle.Y }, { X: rect.X + rect.W, Y: rect.Y }) <= circle.R) {
            return true;
        }
        else {
            return false;
        }
    }
    // Corner Down-Right
    if (circle.X > rect.X + rect.W && circle.Y > rect.Y + rect.H) {
        if (Magnitude({ X: circle.X, Y: circle.Y }, { X: rect.X + rect.W, Y: rect.Y + rect.H }) <= circle.R) {
            return true;
        }
        else {
            return false;
        }
    }
    // Corner Down-Left
    if (circle.X < rect.X && circle.Y > rect.Y + rect.H) {
        if (Magnitude({ X: circle.X, Y: circle.Y }, { X: rect.X, Y: rect.Y + rect.H }) <= circle.R) {
            return true;
        }
        else {
            return false;
        }
    }

    // the test a common rectangle collision
    if (circle.X + circle.R > rect.X && circle.Y + circle.R > rect.Y &&
        circle.X - circle.R < rect.X + rect.W && circle.Y - circle.R < rect.Y + rect.H) {
        return true;
    }
    //
    return false;
}

function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var c = 0; c < ca.length; c++) {
        var d = ca[c];
        while (d.charAt(0) == ' ') {
            d = d.substring(1);
        }
        if (d.indexOf(name) == 0) {
            return d.substring(name.length, d.length);
        }
    }
    return "";
}

function reset() {
    status = 0;
    score = 0;
    yPos = 250;
    lockScroll = false;
    lockJump = false;
    lockBird = true;
    Pipes = [];
    hitTheGround = false;
}

function startGame() {
    status = 1;
    InitPipes();
    lockBird = false;
}

function gameOver() {
    if (status == 2) {
        return 0;
    }

    // hit sound
    if (sfx_hit != null) {
        sfx_hit.play();
    }

    status = 2; // Game Over
    lockScroll = true;
    lockJump = true;

    // Verify the best score
    var bestScoreCookie = getCookie("best");
    newBest = false;
    if (bestScoreCookie == "") {
        // new best score
        bestScore = 0;
        setCookie("best", score);
        newBest = true;
    }
    else {
        var lastBest = parseInt(bestScoreCookie);
        bestScore = lastBest;
        if (score > lastBest) {
            // new best score
            setCookie("best", score);
            newBest = true;
        }
    }

}

function resetScore() {
    setCookie("best", "0");
}

function testCollision() {
    // For the bird will be used the circle a collider
    // The center of the bird may be rotated
    var birdCircle = {
        X: xPos + ((bird.width / birdDrawScale) / 2),
        Y: yPos + ((bird.height / birdDrawScale) / 2),
        R: (bird.height / birdDrawScale) / 2
    };

    for (var i in Pipes) {
        var cPipe = Pipes[i];
        //
        // cPipe.X, -(pipe.height / PipeScale) + cPipe.H
        var rectPipeUp = {
            X: cPipe.X,
            Y: -(pipe.height / PipeScale) + cPipe.H,
            W: (pipe.width / PipeScale),
            H: (pipe.height / PipeScale)
        };
        // cPipe.X, cPipe.H + PipesDistanceY
        var rectPipeDown = {
            X: cPipe.X,
            Y: cPipe.H + PipesDistanceY,
            W: (pipe.width / PipeScale),
            H: (pipe.height / PipeScale)
        };

        // Test each rectangle
        var resRectPipeUp = CircleRectangleCollision(birdCircle, rectPipeUp);
        var resRectPipeDown = CircleRectangleCollision(birdCircle, rectPipeDown);

        if (resRectPipeUp || resRectPipeDown) {
            gameOver();
            // Test Purpose
            //console.log(" Colision!");
        }
        else {
            // Test Purpose
            //console.log(" No Colision!");
        }
    }
    

}

function updateScore() {
    var xBirdCenter = xPos + ((bird.width / birdDrawScale) / 2);
    for (var p in Pipes) {
        var cPipe = Pipes[p];
        if (cPipe.X < xBirdCenter) {
            if (cPipe.Marker == false) {
                Pipes[p].Marker = true;
                score++;
                // Play the sfx
                if (sfx_point != null) {
                    sfx_point.play();
                }
            }
        }
    }

}

function GUpdate(ctx, canvas) {
    // Clear the screen
    ctx.fillStyle = "rgb(100, 149, 237)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateGravity();
    updateBirdPosition();
    if (!lockScroll) {
        doGroundStep();
        updatePipesPosition();
    }
    testCollision();
    updateScore();

    if (lockBird) {
        yGravity = 0;
        yPos = 250;
    }

    // Used for test purpose
    //console.log(getGravityPercentValue());

    // Draw the Pipes
    for (var i in Pipes) {
        var cPipe = Pipes[i];

        // New pipe ize
        var nW = pipe.width / PipeScale;
        var nH = pipe.height / PipeScale;

        // Each pipe object represents two pipes '-'
        // The first one need to be rotated
        ctx.save();
        ctx.translate(cPipe.X, -(pipe.height / PipeScale) + cPipe.H);
        var translW = nW / 2;
        var translH = nH / 2;
        ctx.translate(translW, translH);
        ctx.rotate(180 * Math.PI / 180);
        ctx.drawImage(pipe, -translW, -translH, nW, nH);

        ctx.restore();

        // The second pipe is in their normal rotation
        ctx.drawImage(pipe, cPipe.X, cPipe.H + PipesDistanceY, nW, nH);
    }

    // Draw the bird
    if (bird != null) {
        // Get a new image size based on a new scale
        var nW = bird.width / birdDrawScale;
        var nH = bird.height / birdDrawScale;

        // Save current context
        ctx.save();

        // Rotate the image
        // The rotation depends of the current gravity
        var rotationDegree = ((getGravityPercentValue() * 160) / 100) - 70;
        var traslW = (bird.width / birdDrawScale) / 2;
        var tranlH = (bird.height / birdDrawScale) / 2;
        ctx.translate(xPos, yPos);
        ctx.translate(traslW, tranlH);
        ctx.rotate(rotationDegree * Math.PI / 180);

        // Draw Image
        ctx.drawImage(bird, -traslW, -tranlH, nW, nH);

        // restore context
        ctx.restore();
    }

    // Draw the ground
    // The ground is drawn upon the pipe
    if (ground != null) {
        for (var i = groundStep * (-1) ; i < W + groundStep; i += ground.width) {
            ctx.drawImage(ground, i, H - ground.height);
        }
    }

    if (status == 0) {
        ctx.font = "bold 32px Corbel";
        ctx.fillStyle = "Green";
        ctx.fillText("Press Jump to Start!", 60, 200);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "Black";
        ctx.strokeText("Press Jump to Start!", 60, 200);
    }
    if (status == 1) {
        // Show Score
        ctx.font = "bold 32px Corbel";
        ctx.fillStyle = "Green";
        var txtMetrics = ctx.measureText(score);

        ctx.fillText(score, (W / 2) - (txtMetrics.width / 2), 50);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "Black";
        ctx.strokeText(score, (W / 2) - (txtMetrics.width / 2), 50);

    }
    if (status == 2) {
        // Game Over Status
        // Rectangle
        ctx.rect(50, 150, W - 100, 200);
        ctx.fillStyle = "Yellow";
        ctx.fill();
        ctx.strokeStyle = "Black";
        ctx.stroke();

        // Game Over Message
        ctx.font = "bold 32px Corbel";
        ctx.fillStyle = "Black";
        ctx.fillText("Game Over!", 120, 190);

        // Score
        ctx.font = "24px Corbel";
        ctx.fillStyle = "Black";
        ctx.fillText("Score: " + score, 70, 230);

        // Best Score
        ctx.font = "24px Corbel";
        ctx.fillStyle = "Black";
        ctx.fillText("Best Score: " + bestScore, 70, 260);

        // New Best Score
        if (newBest) {
            // Best Score
            ctx.font = "bold 24px Corbel";
            ctx.fillStyle = "Black";
            ctx.fillText("New Best Score! ", 70, 290);
        }

        // Press Jump Msg
        ctx.font = "24px Corbel";
        ctx.fillStyle = "Black";
        ctx.fillText("Press Jump to Restart", 95, 330);

    }

}

function applySettings() {
    PipesDistanceY = parseInt(document.getElementById("distY").value);
    PipesDistanceX = parseInt(document.getElementById("distX").value);
    yJumpGravity = -parseInt(document.getElementById("jumpForce").value);
    yGravityIncreaser = parseInt(document.getElementById("gravity").value);
}