// game-env.js
class GameEngine {
    constructor() {
      this.reset();
    }
  
    reset() {
      this.bird = { x: 80, y: 300, vel: 0 };
      this.pipes = [];
      this.frameCount = 0;
      this.score = 0;
      this.done = false;
    }
  
    getState() {
      const nextPipe = this.pipes.find(p => p.x + p.width > this.bird.x) || this.pipes[0] || { x: 400, gapY: 300, width: 50 };
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
      if (action === 1) this.flap();
  
      // physics
      this.bird.vel += 0.5;
      this.bird.y += this.bird.vel;
  
      // spawn pipes every 90 frames
      if (this.frameCount % 90 === 0) {
        const gapY = 150 + Math.random() * 200;
        this.pipes.push({ x: 400, gapY, width: 50, passed: false });
      }
      this.frameCount++;
  
      // move pipes & score
      this.pipes.forEach(pipe => {
        pipe.x -= 2;
        if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
          this.score++;
          pipe.passed = true;
        }
      });
      this.pipes = this.pipes.filter(p => p.x > -p.width);
  
      // collisions
      if (this.bird.y > 600 || this.bird.y < 0) this.done = true;
      this.pipes.forEach(p => {
        if (
          this.bird.x > p.x &&
          this.bird.x < p.x + p.width &&
          (this.bird.y < p.gapY - 100 || this.bird.y > p.gapY)
        ) this.done = true;
      });
  
      const reward = this.done ? -100 : 1;
      return { state: this.getState(), reward, done: this.done };
    }
  }
  
  module.exports = { GameEngine };

  

  