var sceneProperties = {
	path: "../resources/pointclouds/points.las/cloud.js",
	cameraPosition: null, 		// other options: cameraPosition: [10,10,10],
	cameraTarget: null, 		// other options: cameraTarget: [0,0,0],
	fov: 60, 					// field of view in degrees,
	sizeType: "Adaptive",	// other options: "Fixed", "Attenuated"
	quality: null, 		// other options: "Circles", "Interpolation", "Splats"
	material: "Intensity", 		// other options: "Height", "Intensity", "Classification"
	pointLimit: 1,				// max number of points in millions
	pointSize: 1,				// 
	navigation: "Orbit",		// other options: "Orbit", "Flight"
};
