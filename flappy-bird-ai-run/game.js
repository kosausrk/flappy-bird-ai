//basic flappy bird **so its easier to train 



class GameEngine {
    constructor(canvas) {
      this.ctx = canvas.getContext('2d');
      this.reset();
    }
  
    reset() {
      this.bird = { x: 80, y: 300, vel: 0 };
      this.pipes = [];
      this.frameCount = 0;
      this.score = 0;
      this.done = false;
    }
  
    // returns state vector [birdY, birdVel, pipeXDist, pipeGapY]
    getState() {
      // find next pipe
      const nextPipe = this.pipes.find(p => p.x + p.width > this.bird.x) || this.pipes[0];
      return [
        this.bird.y / 600,
        this.bird.vel / 10,
        (nextPipe.x - this.bird.x) / 400,
        nextPipe.gapY / 600
      ];
    }
  
    flap() {
      this.bird.vel = -8;
    }
  
    step(action) {
      // apply action
      if (action === 1) this.flap();
  
      // physics
      this.bird.vel += 0.5;
      this.bird.y += this.bird.vel;
  
      // spawn pipes
      if (this.frameCount % 90 === 0) {
        const gapY = 150 + Math.random() * 200;
        this.pipes.push({ x: 400, gapY, width: 50, passed: false });
      }
      this.frameCount++;
  
      // move pipes & check for score/crash
      this.pipes.forEach(pipe => {
        pipe.x -= 2;
        if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
          this.score++;
          pipe.passed = true;
        }
      });
      // remove old
      this.pipes = this.pipes.filter(p => p.x > -p.width);
  
      // check collisions
      if (this.bird.y > 600 || this.bird.y < 0) this.done = true;
      this.pipes.forEach(p => {
        if (
          this.bird.x > p.x && this.bird.x < p.x + p.width &&
          (this.bird.y < p.gapY - 100 || this.bird.y > p.gapY)
        ) this.done = true;
      });
  
      // render
      this.render();
      
      
      //reward function 
      let reward = 0.1;  // small reward for surviving
      this.pipes.forEach(p => {
        if (!p.passed && p.x + p.width < this.bird.x) {
          this.score++;
          reward += 5;  // reward for passing pipe
          p.passed = true;
        }
      });
      if (this.done) reward = -100;



      return { state: this.getState(), reward, done: this.done };
    }
  
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, 400, 600);
      // bird
      ctx.fillStyle = 'yellow';
      ctx.fillRect(this.bird.x, this.bird.y, 20, 20);
      // pipes
      ctx.fillStyle = 'green';
      this.pipes.forEach(p => {
        ctx.fillRect(p.x, 0, p.width, p.gapY - 100);
        ctx.fillRect(p.x, p.gapY, p.width, 600 - p.gapY);
      });
      // score
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${this.score}`, 10, 30);
    }
  }

  
  