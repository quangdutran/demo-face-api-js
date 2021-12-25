const container = document.querySelector('#container'); 
const fileInput = document.querySelector('#file-input');

async function init() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
}

init()

fileInput.addEventListener('change', async (e) => {
    const file = fileInput.files[0];
    const image = await faceapi.bufferToImage(file)
    container.innerHTML=''

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    context.canvas.height = image.naturalHeight;
    context.canvas.width = image.naturalWidth;
    context.drawImage(image, 0, 0);

    container.appendChild(canvas)

    const faces = await faceapi.detectAllFaces(image).withFaceLandmarks();

    for (const face of faces) {
        const features = {
          eyeLeft: face.landmarks.positions.slice(36, 42),
          eyeRight: face.landmarks.positions.slice(42, 48)
        };

        const leftEye = getBoxFromPoints(features.eyeLeft);
        const rightEye = getBoxFromPoints(features.eyeRight);
        
        const height = Math.max(leftEye.height, rightEye.height) * 2;
        const length = getLengthBetweenPoints(leftEye.center, rightEye.center);
        const addedSide = length / 2;
        const leftPointX = leftEye.center.x - addedSide;
        const leftPoint = getPointInTheLine(leftPointX, leftEye.center, rightEye.center);
        const rightPointX = rightEye.center.x + addedSide;
        const rightPoint = getPointInTheLine(rightPointX, leftEye.center, rightEye.center);       

        context.strokeStyle = 'black';
        context.lineWidth = height;

        context.beginPath();
        context.moveTo(leftPoint.x, leftPoint.y);
        context.lineTo(rightPoint.x, rightPoint.y);
        context.stroke();

      }

})

//Given x coordinate, get point (x,y) in the line from firstPoint to secondPoint
function getPointInTheLine(x, firstPoint, secondPoint) {
  const xDivision = secondPoint.x - firstPoint.x;
  const yDivision = secondPoint.y - firstPoint.y;
  const y = (xDivision * firstPoint.y + x * yDivision - firstPoint.x * yDivision) / xDivision;
  return {
    x: x,
    y: y
  }
}

function getLengthBetweenPoints(firstPoint, secondPoint) {
  const x = firstPoint.x - secondPoint.x;
  const y = firstPoint.y - secondPoint.y;
  return Math.sqrt(x*x  + y*y);
}

function getBoxFromPoints(points) {
    const box = {
      bottom: -Infinity,
      left: Infinity,
      right: -Infinity,
      top: Infinity,
  
      get center() {
        return {
          x: this.left + this.width / 2,
          y: this.top + this.height / 2,
        };
      },
  
      get height() {
        return this.bottom - this.top;
      },
  
      get width() {
        return this.right - this.left;
      },
    };
  
    for (const point of points) {
      box.left = Math.min(box.left, point.x);
      box.right = Math.max(box.right, point.x);
  
      box.bottom = Math.max(box.bottom, point.y);
      box.top = Math.min(box.top, point.y);
    }
  
    return box;
  }