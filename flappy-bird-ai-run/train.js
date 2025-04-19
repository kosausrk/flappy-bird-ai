// train.js
const tf = require('@tensorflow/tfjs');          // or '@tensorflow/tfjs-node'
const { GameEngine } = require('./game-env');
const { DQNAgent } = require('./agent');


//function for file save (workaround bc node tensor not supported yet )
const fs = require('fs');
const path = require('path');


//helper function save model to file 
async function saveModelToFile(model, dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const saveResult = await model.save({
    save: async function (modelArtifacts) {
      const modelJsonPath = path.join(dir, 'model.json');
      const weightsBinPath = path.join(dir, 'weights.bin');

      // Write JSON
      fs.writeFileSync(modelJsonPath, JSON.stringify({
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest: [{
          paths: ['weights.bin'],
          weights: modelArtifacts.weightSpecs,
        }]
      }));
      

      // Write weights
      if (modelArtifacts.weightData) {
        fs.writeFileSync(weightsBinPath, Buffer.from(modelArtifacts.weightData));
      }

      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    }
  });

  console.log(`✅ Model saved to ${dir}`);
}




//Getting trained Model 
async function loadModelFromFile(dir) {
  const modelJsonPath = path.join(dir, 'model.json');
  const weightsBinPath = path.join(dir, 'weights.bin');

  const model = await tf.loadLayersModel({
    load: async () => {
      const modelTopology = JSON.parse(fs.readFileSync(modelJsonPath));
      const weightData = fs.readFileSync(weightsBinPath);
      const weightSpecs = modelTopology.weightsManifest[0].weights;

      return {
        modelTopology: modelTopology.modelTopology,
        weightSpecs,
        weightData,
      };
    }
  });

  console.log('Model loaded from file!');
  return model;
}


async function getOrCreateAgent(stateSize, actionSize, modelPath) {
  const agent = new DQNAgent(stateSize, actionSize);

  const modelJsonPath = path.join(modelPath, 'model.json');
  const weightsBinPath = path.join(modelPath, 'weights.bin');

  if (fs.existsSync(modelJsonPath) && fs.existsSync(weightsBinPath)) {
    console.log('📦 Found saved model — loading...');
    console.log("TESTING")
    agent.model = await loadModelFromFile(modelPath);
    agent.epsilon = 0.05; // Lower exploration for inference
  } else {
    console.log('❌ No saved model found — training from scratch...');
    console.log("none found")
  }

  return agent;
}



(async () => {
  //Change depending on how many gen you want 

  const EPISODES = 30;
  const game = new GameEngine();
  
  
  // const agent = new DQNAgent(4, 2);
  const agent = await getOrCreateAgent(4, 2, './models/flappy-dqn'); //custom or pre trained 

  agent.model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
  });
  


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

    // ─── AUTO‑CHECKPOINT ─────────────────────────────────────
    if (ep % 500 === 0) {
      console.log(`\n--- Auto‑checkpoint at episode ${ep} ---`);
      const ckptDir = `./models/checkpoint-${ep}`;
      await saveModelToFile(agent.model, ckptDir);
      fs.writeFileSync(
        './models/bestScore.json',
        JSON.stringify({ bestScore }, null, 2),
        'utf8'
      );
      console.log('✅ Auto‑checkpoint saved');
    }
    

  }

  console.log(`\n Training complete! Best score: ${bestScore}`);
  await saveModelToFile(agent.model, './models/flappy-dqn');

  process.exit(0);
})();