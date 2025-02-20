var config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    backgroundColor: '#000000',
    parent: 'phaser-example',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var snake;
var frog;
var cursors;
var score = 0;
var scoreText;

//  Direction consts
var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('frog', 'assets/frog.png');
    this.load.image('body', 'assets/snake.png');
}

function create ()
{
    var Frog = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:

        function Frog (scene, x, y)
        {
            Phaser.GameObjects.Image.call(this, scene)

            this.setTexture('frog');
            this.setPosition(x * 32, y * 32); // Fixed for 32x32 images
            this.setOrigin(0);

            this.total = 0;

            scene.children.add(this);
        },

        eat: function ()
        {
            this.total++;
        }

    });

    var Snake = new Phaser.Class({

        initialize:

        function Snake (scene, x, y)
        {
            this.headPosition = new Phaser.Geom.Point(x, y);

            this.body = scene.add.group();

            this.head = this.body.create(x * 32, y * 32, 'body'); // Fixed for 32x32 images
            this.head.setOrigin(0);

            this.alive = true;

            this.speed = 100;

            this.moveTime = 0;

            this.tail = new Phaser.Geom.Point(x, y);

            this.heading = RIGHT;
            this.direction = RIGHT;
        },

        update: function (time)
        {
            if (time >= this.moveTime)
            {
                return this.move(time);
            }
        },

        faceLeft: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = LEFT;
            }
        },

        faceRight: function ()
        {
            if (this.direction === UP || this.direction === DOWN)
            {
                this.heading = RIGHT;
            }
        },

        faceUp: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = UP;
            }
        },

        faceDown: function ()
        {
            if (this.direction === LEFT || this.direction === RIGHT)
            {
                this.heading = DOWN;
            }
        },

        move: function (time)
        {
            switch (this.heading)
            {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 20); // 640px / 32px = 20 cols
                    break;

                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 20);
                    break;

                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 15); // 480px / 32px = 15 rows
                    break;

                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 15);
                    break;
            }

            this.direction = this.heading;

            // Update body position with correct size
            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 32, this.headPosition.y * 32, 1, this.tail);

            var hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);

            if (hitBody)
            {
                console.log('dead');
                this.alive = false;
                return false;
            }
            else
            {
                this.moveTime = time + this.speed;
                return true;
            }
        },

        grow: function ()
        {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        },

        collideWithFrog: function (frog)
        {
            if (this.head.x === frog.x && this.head.y === frog.y)
            {
                this.grow();
                frog.eat();
                score += 10; // Increase score
                scoreText.setText('Score: ' + score); // Update score text

                if (this.speed > 20 && frog.total % 5 === 0)
                {
                    this.speed -= 5;
                }

                return true;
            }
            else
            {
                return false;
            }
        },

        updateGrid: function (grid)
        {
            this.body.children.each(function (segment) {
                var bx = segment.x / 32; // Fixed for 32x32 images
                var by = segment.y / 32;

                grid[by][bx] = false;
            });

            return grid;
        }

    });

    frog = new Frog(this, 3, 4);
    snake = new Snake(this, 8, 8);

    //  Create our keyboard controls
    cursors = this.input.keyboard.createCursorKeys();

    //  Add Score Text
    scoreText = this.add.text(10, 10, 'Score: 0', {
        fontSize: '20px',
        fill: '#bfcc00',
        fontFamily: 'Arial'
    });
}

function update (time, delta)
{
    if (!snake.alive)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        snake.faceLeft();
    }
    else if (cursors.right.isDown)
    {
        snake.faceRight();
    }
    else if (cursors.up.isDown)
    {
        snake.faceUp();
    }
    else if (cursors.down.isDown)
    {
        snake.faceDown();
    }

    if (snake.update(time))
    {
        if (snake.collideWithFrog(frog))
        {
            repositionFrog();
        }
    }
}

function repositionFrog ()
{
    var testGrid = [];

    for (var y = 0; y < 15; y++) // Fixed for 32x32 images
    {
        testGrid[y] = [];

        for (var x = 0; x < 20; x++) // Fixed for 32x32 images
        {
            testGrid[y][x] = true;
        }
    }

    snake.updateGrid(testGrid);

    var validLocations = [];

    for (var y = 0; y < 15; y++) // Fixed for 32x32 images
    {
        for (var x = 0; x < 20; x++) // Fixed for 32x32 images
        {
            if (testGrid[y][x] === true)
            {
                validLocations.push({ x: x, y: y });
            }
        }
    }

    if (validLocations.length > 0)
    {
        var pos = Phaser.Math.RND.pick(validLocations);
        frog.setPosition(pos.x * 32, pos.y * 32); // Fixed for 32x32 images
        return true;
    }
    else
    {
        return false;
    }
}
