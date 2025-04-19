console.log("✅ browser-main.js is loaded!");


const canvas = document.getElementById('gameCanvas');
const game = new GameEngine(canvas);
const agent = new DQNAgent(4, 2);

const statusDiv = document.getElementById("status");


async function loadPretrainedModel() {
    try {
      const model = await tf.loadLayersModel('./models/flappy-dqn/model.json');
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
  
      agent.model = model;
      agent.epsilon = 0.0; // only exploit, no training if you want
  
      console.log("✅ Loaded pretrained model!");
      statusDiv.innerText = "✅ Loaded pretrained model!";
    } catch (err) {
      console.error("❌ Failed to load model:", err);
    }
  }
  
  
 


async function trainEpisode() {
  console.log("🎯 New Episode Started");
  game.reset();
  let { state, reward, done } = { state: game.getState(), reward: 0, done: false };

  let stepCount = 0;

  while (!done) {
    const action = agent.act(state);
    const stepResult = game.step(action);
    agent.remember(state, action, stepResult.reward, stepResult.state, stepResult.done);
    state = stepResult.state;
    done = stepResult.done;

    stepCount++;
    if (stepCount % 30 === 0) {
      console.log(`📦 Step ${stepCount}, Score: ${game.score}`);
    }

    if (game.frameCount % 5 === 0 && agent.memory.length > 10) {
      console.log("📚 Training mini-batch...");
      await agent.replay(32);
    }

    await tf.nextFrame(); // yield to browser to keep canvas smooth
  }

  console.log(`✅ Episode complete — Final Score: ${game.score}`);
}

(async function runTrainingLoop() {
  try {
    console.log("⏳ Starting training loop...");
    
    //SET GENERATION AMOUNT 
    await loadPretrainedModel();


    for (let ep = 1; ep <= 50; ep++) {
      await trainEpisode();
      const msg = `Episode ${ep} — Score: ${game.score} — ε=${agent.epsilon.toFixed(2)}`;
      console.log(msg);
      if (statusDiv) statusDiv.innerText = msg;
    }

    console.log('🎉 Training complete! Now watching AI.');
    if (statusDiv) statusDiv.innerText = '🎉 Training complete! Watching AI...';

    agent.epsilon = 0.0;
    for (let i = 1; i <= 3; i++) {
      console.log(`👀 Watch run ${i}`);
      await trainEpisode();
      if (statusDiv) statusDiv.innerText = `👀 Watching AI — Run ${i} — Score: ${game.score}`;
    }

  } catch (err) {
    console.error("🔥 Error in training loop:", err);
    if (statusDiv) statusDiv.innerText = "⚠️ Error occurred. Check console.";
  }
})();
