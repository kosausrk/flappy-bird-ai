const canvas = document.getElementById('gameCanvas');
const game = new GameEngine(canvas);
const agent = new DQNAgent(4, 2);

async function trainEpisode() {
  game.reset();
  let { state, reward, done } = { state: game.getState(), reward: 0, done: false };
  while (!done) {
    const action = agent.act(state);
    const stepResult = game.step(action);
    agent.remember(state, action, stepResult.reward, stepResult.state, stepResult.done);
    state = stepResult.state;
    done = stepResult.done;
    if (game.frameCount % 5 === 0 && agent.memory.length > 1000) {
      await agent.replay(64);
    }
    await tf.nextFrame(); // yield to browser for rendering
  }
}

// kick off training loop

//50 Cycles
(async function() {
  for (let ep = 1; ep <= 50; ep++) {
    await trainEpisode();
    console.log(`Episode ${ep} complete — ε=${agent.epsilon.toFixed(2)} — score=${game.score}`);
  }
  console.log('Training complete! Now watch the AI play.');
  // Here you could disable learning and let agent.act drive the rendering loop
})();


