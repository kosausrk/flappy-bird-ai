class DQNAgent {
    constructor(stateSize, actionSize) {
      this.stateSize = stateSize;
      this.actionSize = actionSize;
      this.epsilon = 1.0;          // explore rate
      this.epsilonMin = 0.01;
      this.epsilonDecay = 0.995;
      this.gamma = 0.95;           // discount factor
      this.memory = [];
      this.buildModel();
    }
  
    buildModel() {
      this.model = tf.sequential();
      this.model.add(tf.layers.dense({ inputShape: [this.stateSize], units: 64, activation: 'relu' }));
      this.model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      this.model.add(tf.layers.dense({ units: this.actionSize, activation: 'linear' }));
      this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    }
  
    act(state) {
      if (Math.random() < this.epsilon) {
        return Math.floor(Math.random() * this.actionSize);
      }
      return tf.tidy(() => {
        const qs = this.model.predict(tf.tensor2d([state]));
        return qs.argMax(-1).dataSync()[0];
      });
    }
  
    remember(s, a, r, sNext, done) {
      this.memory.push({ s, a, r, sNext, done });
      if (this.memory.length > 50000) this.memory.shift();
    }
  
    async replay(batchSize = 32) {
      const sample = [];
      for (let i = 0; i < batchSize; i++) {
        sample.push(this.memory[Math.floor(Math.random() * this.memory.length)]);
      }
  
      const states = [];
      const targets = [];
  
      for (let { s, a, r, sNext, done } of sample) {
        const qsa = await tf.tidy(() => this.model.predict(tf.tensor2d([s])).arraySync()[0]);
        let target = r;
        if (!done) {
          const qNext = this.model.predict(tf.tensor2d([sNext])).max(-1).dataSync()[0];
          target = r + this.gamma * qNext;
        }
        qsa[a] = target;
        states.push(s);
        targets.push(qsa);
      }
  
      await this.model.fit(
        tf.tensor2d(states),
        tf.tensor2d(targets),
        { batchSize, epochs: 1, verbose: 0 }
      );
  
      if (this.epsilon > this.epsilonMin) {
        this.epsilon *= this.epsilonDecay;
      }
    }
  }
  