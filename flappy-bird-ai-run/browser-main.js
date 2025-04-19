const canvas = document.getElementById('gameCanvas');
const game = new GameEngine(canvas);
const agent = new DQNAgent(4, 2);

const statusDiv = document.getElementById("status");

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

    await tf.nextFrame(); // render frame and allow UI to update
  }
}

(async function runTrainingLoop() {
  for (let ep = 1; ep <= 50; ep++) {
    await trainEpisode();
    const msg = `Episode ${ep} — Score: ${game.score} — ε=${agent.epsilon.toFixed(2)}`;
    console.log(msg);
    if (statusDiv) statusDiv.innerText = msg;
  }

  console.log('✅ Training complete! Now watch the AI play.');
  if (statusDiv) statusDiv.innerText = '✅ Training complete! AI is now playing...';

  // OPTIONAL: Save model in browser
  // await agent.model.save('indexeddb://flappy-dqn');

  // Let the AI play forever (no learning)
  agent.epsilon = 0.0;
  while (true) {
    await trainEpisode();
    if (statusDiv) statusDiv.innerText = `Watching AI — Score: ${game.score}`;
  }
})();
