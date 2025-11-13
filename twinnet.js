import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.21.0/dist/tf.min.js';

let model;

const ENTANGLED_WEIGHTS = {
  'dense/kernel': tf.randomNormal([33, 64]).arraySync(),
  'dense/bias': tf.randomNormal([64]).arraySync(),
  'dense_1/kernel': tf.randomNormal([64, 32]).arraySync(),
  'dense_1/bias': tf.randomNormal([32]).arraySync()
};

export async function loadTwin() {
  if (model) return model;
  await tf.ready();

  model = tf.sequential({
    layers: [
      tf.layers.dense({ units: 64, activation: 'relu', inputShape: [33] }),
      tf.layers.dense({ units: 32, activation: 'tanh' })
    ]
  });

  const w = [
    tf.tensor2d(ENTANGLED_WEIGHTS['dense/kernel']),
    tf.tensor1d(ENTANGLED_WEIGHTS['dense/bias']),
    tf.tensor2d(ENTANGLED_WEIGHTS['dense_1/kernel']),
    tf.tensor1d(ENTANGLED_WEIGHTS['dense_1/bias'])
  ];
  model.setWeights(w);
  return model;
}

export function infer(seed) {
  const input = tf.tensor2d([seed.map(v => v / 255)], [1, 33]);
  const out = model.predict(input);
  const result = Array.from(out.dataSync());
  out.dispose(); input.dispose();
  return result;
}
