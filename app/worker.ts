import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;
// huggingface.co 国内直连超时，走镜像站下载模型
env.remoteHost = 'https://hf-mirror.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let classifier: any = null;

self.addEventListener('message', async (event) => {
  const { text, id } = event.data;
  try {
    if (!classifier) {
      self.postMessage({ status: 'loading', id });
      classifier = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-multilingual-cased-sentiments-student',
      );
    }
    self.postMessage({ status: 'inferencing', id });
    const result = await classifier(text.slice(0, 512));
    self.postMessage({ status: 'complete', id, result });
  } catch (error) {
    self.postMessage({ status: 'error', id, error: String(error) });
  }
});
