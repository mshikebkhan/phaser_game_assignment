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

//  Direction consts
var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

var game = new Phaser.Game(config);

function preload() {
    this.load.image('frog', 'assets/frog.png');
    this.load.image('body', 'assets/snake.png');
}

function create() {
    class Frog extends Phaser.GameObjects.Image {
        constructor(scene, x, y) {
            super(scene, x * 16, y * 16, 'frog');
            this.setOrigin(0);
            this.total = 0;
            scene.add.existing(this);
        }

        eat() {
            this.total++;
        }
    }

    class Snake {
        constructor(scene, x, y) {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
        }

        update(time) {
            if (time >= this.moveTime) {
                return this.move(time);
            }
        }

        faceLeft() {
            if (this.direction === UP || this.direction === DOWN) {
                this.heading = LEFT;
            }
        }

        faceRight() {
            if (this.direction === UP || this.direction === DOWN) {
                this.heading = RIGHT;
            }
        }

        faceUp() {
            if (this.direction === LEFT || this.direction === RIGHT) {
                this.heading = UP;
            }
        }

        faceDown() {
            if (this.direction === LEFT || this.direction === RIGHT) {
                this.heading = DOWN;
            }
        }

        move(time) {
            switch (this.heading) {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30);
                    break;
            }

            this.direction = this.heading;

            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);

            var hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);

            if (hitBody) {
                console.log('Game Over');
                this.alive = false;
                return false;
            } else {
                this.moveTime = time + this.speed;
                return true;
            }
        }

        grow() {
            var newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        }

        collideWithFrog(frog) {
            if (this.head.x === frog.x && this.head.y === frog.y) {
                this.grow();
                frog.eat();
                if (this.speed > 20 && frog.total % 5 === 0) {
                    this.speed -= 5;
                }
                return true;
            } else {
                return false;
            }
        }

        updateGrid(grid) {
            this.body.children.each((segment) => {
                var bx = segment.x / 16;
                var by = segment.y / 16;
                grid[by][bx] = false;
            });
            return grid;
        }
    }

    frog = new Frog(this, 3, 4);
    snake = new Snake(this, 8, 8);

    cursors = this.input.keyboard.createCursorKeys();
}

function update(time) {
    if (!snake.alive) {
        return;
    }

    if (cursors.left.isDown) {
        snake.faceLeft();
    } else if (cursors.right.isDown) {
        snake.faceRight();
    } else if (cursors.up.isDown) {
        snake.faceUp();
    } else if (cursors.down.isDown) {
        snake.faceDown();
    }

    if (snake.update(time)) {
        if (snake.collideWithFrog(frog)) {
            repositionFrog();
        }
    }
}

function repositionFrog() {
    var testGrid = Array.from({ length: 30 }, () => Array(40).fill(true));

    snake.updateGrid(testGrid);

    var validLocations = [];

    for (var y = 0; y < 30; y++) {
        for (var x = 0; x < 40; x++) {
            if (testGrid[y][x]) {
                validLocations.push({ x, y });
            }
        }
    }

    if (validLocations.length > 0) {
        var pos = Phaser.Math.RND.pick(validLocations);
        frog.setPosition(pos.x * 16, pos.y * 16);
        return true;
    } else {
        return false;
    }
}
