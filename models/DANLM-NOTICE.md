DanLM V1 model weight was obtained from [dashidhy/DanLM](https://github.com/dashidhy/DanLM), source revision `16ace5ada4db39086bb4c8ebb372ed16cb82fab1`.

`danlm-v1-compact.onnx` is a format conversion of `ckpts/DanLM_v1/dansformer_v1_best_eval.pt` for browser inference. Large weights are stored as float16 and cast back to float32 at model load; the model was not retrained. The unmodified float32 ONNX export is retained in the development repository's `tests/model-reference/` directory. This conversion and the separate JavaScript game-state encoder are modifications made by this project; they are not an official DanLM release.

Copyright 2026 DanLM Authors. The source license, including its non-commercial use restriction, is in [DANLM-LICENSE](DANLM-LICENSE).
