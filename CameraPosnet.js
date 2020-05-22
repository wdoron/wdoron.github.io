function isDef(obj){
	return typeof(obj) !== 'undefined' && obj !== null;
}

function sizeOf( object ) {

    var objectList = [];

    var recurse = function( value )
    {
        var bytes = 0;

        if ( typeof value === 'boolean' ) {
            bytes = 4;
        }
        else if ( typeof value === 'string' ) {
            bytes = value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes = 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList[ objectList.length ] = value;

            for( i in value ) {
                bytes+= 8; // an assumed existence overhead
                bytes+= recurse( value[i] )
            }
        }

        return bytes;
    }

    return recurse( object );
}

 // const loadmodelinput = {
    // architecture: 'resnet50',//['mobilenetv1', 'resnet50']
    // outputstride: 32,//16/32
    // inputresolution: 300,//[200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]
    // multiplier: 1,// [1]
    // quantbytes: 4 // [1, 2, 4]
  // }; 
const loadmodelinput = {
    architecture: 'mobilenetv1',//['mobilenetv1', 'resnet50']
    outputstride: 16,//8/16
    inputresolution: 500,//[200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]
    multiplier: .75,// [0.50, 0.75, 1.0]
    quantbytes: 4 // [1, 2, 4]
  };
  
const minPoseScore = 0.3;
const minPartScore = 0.15;
const scoreThreshold = 0.55;
const captureImgInterval = 50;
const img = document.querySelector('#screenshot img');
//const video = document.querySelector('#screenshot video');

const videoElement = document.getElementById('vid');
const canvas = document.querySelector('#screenshot canvas');

const imageElement = document.getElementById('pic');

const maxPoseDetections = 3;

const nmsRadius = 20;
 
const scaleFactor = 0.5;
const flipHorizontal = true;
const outputStride = 32;

const posResolution = 1000;
const posScoreResolution = 10;
const avatarScoreResolution = 100;

const constraints = {
  video: true
};

var newSkeleton = false;
var skeletonJson = "";

		
const video = document.querySelector('video');
const width = 640;
const height = 480;
const vgaConstraints = {
  video: {width: {exact: width}, height: {exact: height}}
};

function getSkeletonStr(){
	var ret =  newSkeleton ? skeletonJson : "";
	newSkeleton = false;
	return ret;
}
function sendBytesToUnity(skeletonBytes){
	//console.log("Arr  " +  skeletonBytes.length + " *8");
	//console.log(skeletonBytes);
	//console.log('sizeIs= ' + sizeOf(skeletonBytes[0]));
	
	unityInstance.SendMessage('JavascriptApi', 'OnSkeletonReceive', skeletonBytes);
}


function skeletonToJson(poses){
	//return JSON.stringify(pose);
	
	var bytesArr = [];//poses.length * (1+17*3 = 52)
	for(j=0; j < poses.length; ++j){
		pose = poses[j];
		if(pose.score < minPoseScore) continue;
		
		bytesArr.push(Math.round(pose.score*avatarScoreResolution));
		var skeleton = pose.keypoints;
		var factor = posResolution /(width>height?width:height);
		for (i=0; i < skeleton.length; ++i){
			//bytesArr.push(skeleton[i].part);
			
			bytesArr.push(skeleton[i].score <= minPartScore ? 0 : Math.round(skeleton[i].score*posScoreResolution));
			bytesArr.push(Math.round((width - skeleton[i].position.x)*factor));
			bytesArr.push(Math.round((height-skeleton[i].position.y)*factor));
		}
	}
	return  bytesArr.length > 0 ? JSON.stringify(bytesArr) : "";
}


      // guiState.net = await posenet.load({
        // architecture: guiState.architecture,
        // outputStride: guiState.outputStride,
        // inputResolution: guiState.inputResolution,
        // multiplier: +guiState.changeToMultiplier,
        // quantBytes: guiState.quantBytes
      // });
	  
	   // const pose = await guiState.net.estimatePoses(video, {
          // flipHorizontal: flipPoseHorizontal,
          // decodingMethod: 'single-person'
        // });
		
		// let all_poses = await guiState.net.estimatePoses(video, {
          // flipHorizontal: flipPoseHorizontal,
          // decodingMethod: 'multi-person',
          // maxDetections: guiState.multiPoseDetection.maxPoseDetections,
          // scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
          // nmsRadius: guiState.multiPoseDetection.nmsRadius
        // });
		
	
//const net = await posenet.load();
  
var posenetLoad = typeof(loadModelInput) === 'undefined' ? posenet.load() : posenet.load(loadModelInput);
      
	  posenetLoad.then(function(net) {

	console.log("load ", net );
	


	function captureImg() {

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext('2d').drawImage(video, 0, 0);
		// Other browsers will fall back to image/png

		//img.src = canvas.toDataURL('image/webp');
		
		var poseLoad = net.estimateMultiplePoses(canvas, scaleFactor, flipHorizontal, outputStride, maxPoseDetections, scoreThreshold, nmsRadius);
		//[pose,pose]


		//var poseLoad = net.estimateSinglePose(canvas, scaleFactor, flipHorizontal, outputStride);
		poseLoad.then(function(poses){
			var str = "_POSE  " + poses.length ;
			for(var i=0; i < poses.length; ++i){
				str = str + " " + poses[i].score
			}
			console.log(str);
			
			skeletonJson = skeletonToJson(poses);
			newSkeleton = true;
			//sendBytesToUnity(strInput);
		});
			// posenet model loaded
		  //});
};

setInterval(captureImg, captureImgInterval);
        // posenet model loaded
      });
	  


navigator.mediaDevices.getUserMedia(vgaConstraints).
  then((stream) => {video.srcObject = stream});
