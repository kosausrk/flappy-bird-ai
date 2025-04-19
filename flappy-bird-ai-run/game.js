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
      //REPLACED
      const nextPipe = this.pipes.find(p => p.x + p.width > this.bird.x) || 
                 this.pipes[0] || 
                 { x: 400, gapY: 300, width: 50 };
      
      

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
    
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#70c5ce'); // light sky blue
      gradient.addColorStop(1, '#ffffff'); // bottom white
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 600);
    
      // Bird
      ctx.fillStyle = 'yellow';
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(this.bird.x, this.bird.y, 20, 20, 5);
      ctx.fill();
      ctx.stroke();
    
      // Pipes
      this.pipes.forEach(p => {
        // Top pipe
        ctx.fillStyle = '#2ecc71'; // green
        ctx.strokeStyle = '#27ae60'; // darker outline
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, 0, p.width, p.gapY - 100);
        ctx.strokeRect(p.x, 0, p.width, p.gapY - 100);
    
        // Bottom pipe
        ctx.fillRect(p.x, p.gapY, p.width, 600 - p.gapY);
        ctx.strokeRect(p.x, p.gapY, p.width, 600 - p.gapY);
      });
    
      // Score text
      ctx.fillStyle = 'white';
      ctx.font = '28px Arial';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(`Score: ${this.score}`, 10, 35);
      ctx.shadowBlur = 0; // reset shadow


      console.log('Rendering frame');
    }
}

  
  