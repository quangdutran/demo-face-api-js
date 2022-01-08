const container = document.querySelector('#container'); 
const fileInput = document.querySelector('#file-input');
let eyes = [];
let canva = {};

async function init() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
}

init()

document.getElementById("removeLine").addEventListener("click", function() {
  if (canva) {
    canva.remove(canva.getActiveObject());
  }
});

fileInput.addEventListener('change', async (e) => {
    const file = fileInput.files[0];
    const image = await faceapi.bufferToImage(file)
    
    canva = new fabric.Canvas('canvas', {
      width: image.naturalWidth,
      height: image.naturalHeight
    });

    new fabric.Image.fromObject(image, (i) => {
      canva.backgroundImage = i;
      canva.renderAll();
    })

    const faces = await faceapi.detectAllFaces(image).withFaceLandmarks();

    for (const face of faces) {
        const features = {
          eyeLeft: face.landmarks.positions.slice(36, 42),
          eyeRight: face.landmarks.positions.slice(42, 48)
        };
        eyes.push(features);

        const leftEye = getBoxFromPoints(features.eyeLeft);
        const rightEye = getBoxFromPoints(features.eyeRight);
        const height = Math.max(leftEye.height, rightEye.height) * 2.5;
        const length = getLengthBetweenPoints(leftEye.center, rightEye.center);
        const addedSide = length / 2;
        const leftEyeTopPoint = {
          x: leftEye.center.x,
          y: leftEye.top - height / 3
        };
        const rightEyeTopPoint = {
          x: rightEye.center.x,
          y: rightEye.top - height / 3
        }

        const leftPointX = leftEye.left - addedSide;
        const leftPoint = getPointInTheLine(leftPointX, leftEyeTopPoint , rightEyeTopPoint);
        const rightPointX = rightEye.right + addedSide / 2;
        const rightPoint = getPointInTheLine(rightPointX, leftEyeTopPoint , rightEyeTopPoint);      
        
        let line = new fabric.Line([leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y], {
          stroke: 'black',
          strokeWidth: height
        });
        
        canva.add(line);
        eyes.push(line);
      }
      canva.renderAll();
})



//Given x coordinate, get point (x,y) in the line from firstPoint to secondPoint
//Find the 2-variable simple equation, put x in and find y
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