// train.js
const tf = require('@tensorflow/tfjs');          // or '@tensorflow/tfjs-node'
const { GameEngine } = require('./game-env');
const { DQNAgent } = require('./agent');

(async () => {
  //Change depending on how many gen you want 


  const EPISODES = 5000;
  const game = new GameEngine();
  const agent = new DQNAgent(4, 2);

  let bestScore = -Infinity;

  for (let ep = 1; ep <= EPISODES; ep++) {
    game.reset();
    let { state, reward, done } = {
      state: game.getState(),
      reward: 0,
      done: false
    };

    while (!done) {
      const action = agent.act(state);
      const { state: nextState, reward: r, done: d } = game.step(action);
      agent.remember(state, action, r, nextState, d);
      state = nextState;
      done = d;

      // Train every 5 frames once we have enough memory
      if (game.frameCount % 5 === 0 && agent.memory.length > 1000) {
        await agent.replay(64);
      }
    }

    // Update bestScore
    if (game.score > bestScore) {
      bestScore = game.score;
    }

    console.log(
      `Episode ${ep} complete — ε=${agent.epsilon.toFixed(2)} ` +
      `— score=${game.score}` +
      (game.score === bestScore ? ' ← new best!' : '')
    );
  }

  console.log(`\n🦾 Training complete! Best score: ${bestScore}`);
  process.exit(0);
})();
