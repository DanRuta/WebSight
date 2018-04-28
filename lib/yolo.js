const INPUT_DIM = 416;

const DEFAULT_FILTER_BOXES_THRESHOLD = 0.01;
const DEFAULT_IOU_THRESHOLD = 0.4;
const DEFAULT_CLASS_PROB_THRESHOLD = 0.4
const DEFAULT_MODEL_LOCATION =
  'https://raw.githubusercontent.com/MikeShi42/yolo-tiny-tfjs/master/model2.json';

 async function downloadModel(url = DEFAULT_MODEL_LOCATION) {
  return await tf.loadModel(url);
}

async function yolo(
  input,
  model,
  classProbThreshold = DEFAULT_CLASS_PROB_THRESHOLD,
  iouThreshold = DEFAULT_IOU_THRESHOLD,
  filterBoxesThreshold = DEFAULT_FILTER_BOXES_THRESHOLD
) {
  const [all_boxes, box_confidence, box_class_probs] = tf.tidy(() => {
    const activation = model.predict(input);

    const [box_xy, box_wh, box_confidence, box_class_probs ] =
      yolo_head(activation, YOLO_ANCHORS, 80);

    const all_boxes = yolo_boxes_to_corners(box_xy, box_wh);

    box_xy.dispose()
    box_wh.dispose()

    return [all_boxes, box_confidence, box_class_probs];
  });

  let [boxes, scores, classes] = await yolo_filter_boxes(
    all_boxes, box_confidence, box_class_probs, filterBoxesThreshold);

  // If all boxes have been filtered out
  if (boxes == null) {
    return [];
  }

  const width = tf.scalar(INPUT_DIM);
  const height = tf.scalar(INPUT_DIM);

  const image_dims = tf.stack([height, width, height, width]).reshape([1,4]);

  boxes = tf.mul(boxes, image_dims);

  const [ pre_keep_boxes_arr, scores_arr ] = await Promise.all([
    boxes.data(), scores.data(),
  ]);

  boxes.dispose()
  scores.dispose()


  const [ keep_indx, boxes_arr, keep_scores ] = non_max_suppression(
    pre_keep_boxes_arr,
    scores_arr,
    iouThreshold,
  );

  // console.log(box_xy, box_wh, box_confidence, box_class_probs, classes, keep_indx)

  const keep_indx_t = classes.gather(tf.tensor1d(keep_indx))

  // const classes_indx_arr = await classes.gather(tf.tensor1d(keep_indx)).data();
  const classes_indx_arr = await keep_indx_t.data();

  keep_indx_t.dispose()
  width.dispose()
  height.dispose()

  all_boxes.dispose()
  box_confidence.dispose()
  box_class_probs.dispose()
  classes.dispose()

  // console.log(box_confidence, box_class_probs, classes, keep_indx)

  const results = [];

  classes_indx_arr.forEach((class_indx, i) => {
    const classProb = keep_scores[i];
    if (classProb < classProbThreshold) {
      return;
    }

    const className = class_names[class_indx];
    let [top, left, bottom, right] = boxes_arr[i];

    top = Math.max(0, top);
    left = Math.max(0, left);
    bottom = Math.min(416, bottom);
    right = Math.min(416, right);

    const resultObj = {
      className,
      classProb,
      bottom,
      top,
      left,
      right,
    };

    results.push(resultObj);
  });

  return results;
}
