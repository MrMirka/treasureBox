var canvas = document.getElementById("renderCanvas");
var sceneW =  canvas.getBoundingClientRect().width;
var sceneH =  canvas.getBoundingClientRect().width.height;
        var startRenderLoop = function (engine, canvas) {
            engine.runRenderLoop(function () {
                if (sceneToRender && sceneToRender.activeCamera) {
                    sceneToRender.render();
                }
            });
        }

		let isOpen = false;
		let holdAnimation = false;
        var engine = null;
        var scene = null;
		var topChest = null;
		var bottomChest = null;
		var trasure = null;
		var runAnim = false;

		var godrays;
        var sceneToRender = null;
        var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };
        var createScene = function () {
        	var scene = new BABYLON.Scene(engine);
			scene.clearColor = new BABYLON.Color3(1, 0, 0);
			//scene.environmentTexture = new BABYLON.CubeTexture("textures/chest_env.env", scene)
			scene.environmentTexture = new BABYLON.CubeTexture("textures/chest.env", scene)
			scene.environmentIntensity = 0.5
			console.log(scene)
          
        	var harmonic = function(m, lat, long, paths) {
        		var pi = Math.PI;
        		var pi2 = Math.PI * 2;
        		var steplat = pi / lat;
        		var steplon = pi2 / long;
        
        		for (var theta = 0; theta <= pi2; theta += steplon) {
        			var path = [];
        
        			for (var phi = 0; phi <= pi; phi += steplat ) {
        				var r = 0;
        				r += Math.pow( Math.sin(m[0]*phi), m[1] );
        				r += Math.pow( Math.cos(m[2]*phi), m[3] );
        				r += Math.pow( Math.sin(m[4]*theta), m[5] );
        				r += Math.pow( Math.cos(m[6]*theta), m[7] );
        
        				var p = new BABYLON.Vector3( r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta) );
        				path.push(p);
        			}
        			paths.push(path);
        		}
        		paths.push(paths[0]);
        	};
        	// -----------------------------------------------
        	var showPath = function(path, scene) {
        		var line = BABYLON.Mesh.CreateLines("line", path, scene )
        	};
        	// -----------------------------------------------
        	var paths = [];
        
        	// here's the 'm' numbers used to create the SH shape
        	// var m = [7,3,8,0,9,2,7,2];
        	var m = [
        		Math.random().toFixed(1)*10,
        		Math.random().toFixed(1)*10,
        
        		// 1, // this makes the shapes more basic, less spikey.  Or use this line...
        		Math.random().toFixed(1)*10,
        
        		Math.random().toFixed(1)*10,
        		Math.random().toFixed(1)*10,
        		Math.random().toFixed(1)*10,
        		Math.random().toFixed(1)*10,
        		Math.random().toFixed(1)*10
        	];
        	console.log("m-numbers: " + m);
        	// -----------------------------------------------
        	// go make the shape!
        	harmonic(m, 64, 64, paths);
        
        
        	// -----------------------------------------------
        	// clone of the BJS fire procedural texture's shader
        	BABYLON.Effect.ShadersStore["myFirePixelShader"]=
        
        		"#ifdef GL_ES\r\n"+
        		"precision highp float;\r\n"+
        		"#endif\r\n"+
        
        		"uniform float time;\r\n"+
        		"uniform vec3 c1;\r\n"+
        		"uniform vec3 c2;\r\n"+
        		"uniform vec3 c3;\r\n"+
        		"uniform vec3 c4;\r\n"+
        		"uniform vec3 c5;\r\n"+
        		"uniform vec3 c6;\r\n"+
        		"uniform vec2 speed;\r\n"+
        		"uniform float shift;\r\n"+
        		"uniform float alphaThreshold;\r\n"+
        
        		"varying vec2 vUV;\r\n"+
        
        		"float rand(vec2 n) {\r\n"+
        		"	return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\r\n"+
        		"}\r\n"+
        
        		"float noise(vec2 n) {\r\n"+
        		"	const vec2 d = vec2(0.0, 1.0);\r\n"+
        		"	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));\r\n"+
        		"	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);\r\n"+
        		"}\r\n"+
        
        		"float fbm(vec2 n) {\r\n"+
        		"	float total = 0.0, amplitude = 1.0;\r\n"+
        		"	for (int i = 0; i < 4; i++) {\r\n"+
        		"		total += noise(n) * amplitude;\r\n"+
        		"		n += n;\r\n"+
        		"		amplitude *= .5;\r\n"+
        		"	}\r\n"+
        		"	return total;\r\n"+
        		"}\r\n"+
        
        		"void main() {\r\n"+
        		"	vec2 p = vUV * 8.0;\r\n"+
        		"	float q = fbm(p - time * .1);\r\n"+
        		"	vec2 r = vec2(fbm(p + q + time * speed.x - p.x - p.y), fbm(p + q - time * speed.y));\r\n"+
        		"	vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);\r\n"+
        		"	vec3 color = c * cos(shift * vUV.y);\r\n"+
        		"	float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));\r\n"+
        
        		"	gl_FragColor = vec4(color, luminance * alphaThreshold + (1.0 - alphaThreshold));\r\n"+
        	"}";
        	
        	// -----------------------------------------------
        	// create/texturize the fire material that uses it
        	var fireMaterial = new BABYLON.StandardMaterial("fontainSculptur2", scene);
        	var fireTexture = new BABYLON.FireProceduralTexture("fire", 32, scene);
        	fireTexture.level = 1;
        
        	// black area compensator
        	fireTexture.uScale = .7;
        	fireTexture.vScale = .7;
        
        	// el forco de shadero
        	fireTexture.setFragment("myFire");
        
        	// turn more fire material knobs
        	fireMaterial.diffuseColor = new BABYLON.Color3(Math.random()/2, Math.random()/2, Math.random()/2);
        	
        	fireMaterial.diffuseTexture = fireTexture;
        	fireMaterial.alpha = 1;
        	fireMaterial.specularTexture = fireTexture;
        	fireMaterial.emissiveTexture = fireTexture;
        	fireMaterial.specularPower = 4;
        	fireMaterial.backFaceCulling = false;
        
        	
        	// or stock the firecolors array with six colors
        	fireTexture.fireColors = [
        		new BABYLON.Color3(0.8, 0.8, 0.4),
				new BABYLON.Color3(0.7, 0.74, 0.4),
				new BABYLON.Color3(0.8, 0.6, 0.4),
				new BABYLON.Color3(0.6, 0.8, 0.23),
				new BABYLON.Color3(0.7, 0.8, 0.36),
				new BABYLON.Color3(0.6, 0.6, 0.42),
        	];

		/* 	fireTexture.fireColors = [
        		new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
        		new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
        		new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
        		new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
        		new BABYLON.Color3(Math.random(), Math.random(), Math.random()),
        		new BABYLON.Color3(Math.random(), Math.random(), Math.random())   
        	]; */
        

        	// Adding some experimenter's lights
        	 var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 0, 0), scene);
        	light.diffuse = new BABYLON.Color3(1, 1, 1);
        	light.intensity = .02;
 
        
        
        	//Adding an Arc Rotate Camera
        	var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI * 0.12, 1.1, 8, BABYLON.Vector3.Zero(), scene);
        	//camera.attachControl(canvas, true);
			camera.position = new BABYLON.Vector3(3.7,1.6,-2.5);
			camera.target = new BABYLON.Vector3(0,0.5,0);
    
                BABYLON.SceneLoader.ImportMesh("", "/models/", "treasure.glb", scene, function (meshes, particleSystems, skeletons) {
              meshes.forEach(mesh => {	  
					trasure = meshes[0]
                    if(mesh.material) {
                        mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
                        mesh.position = new BABYLON.Vector3(0.2, 0.4, -0.1);
                        mesh.rotation = new BABYLON.Vector3(0,68,0);
                        mesh.material = fireMaterial;
                        godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, mesh, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
                        godrays.exposure = 0.2;
                        godrays.decay = 0.96815;
                        godrays.weight = 0.58767;
                        godrays.density = 1.226;
                        light.position = godrays.mesh.position;
						
						setAnimation(godrays);
	
                    }
                  })
            });    
 
            BABYLON.SceneLoader.ImportMesh("", "/models/GLTF/", "armor_chest_blender_DRACO.gltf", scene, function (meshes, particleSystems, skeletons) {
				

				//add shadow
				const ground = BABYLON.Mesh.CreateGround("ground", 10, 10, 22, scene);
				ground.position = new BABYLON.Vector3(-0.11,0,0);
				ground.scaling = new BABYLON.Vector3(0.4,0.4,0.4);
				var mat = new BABYLON.StandardMaterial("shadow", scene);
				mat.diffuseColor = new BABYLON.Color3(0.02, 0.01, 0.01);
				mat.roughness = 1;
				mat.metallness = 0;
				mat.specularPower = 100000000;
				mat.opacityTexture = new BABYLON.Texture("textures/shadowMask.png", scene);
				ground.material = mat;
/* 
				trasure = meshes[1]
				trasure.material = fireMaterial;
				trasure.position = new BABYLON.Vector3(0,0.1,0)
				trasure.scaling = new BABYLON.Vector3(0.9,0.9,0.9)
				godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, trasure, 200, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
				godrays.exposure = 0.3;
				godrays.decay = 0.96815;
				godrays.weight = 0.78767;
				godrays.density = 1.426;
				light.position = godrays.mesh.position;
				
				setAnimation(godrays);  */

				topChest = meshes[2];
				bottomChest = meshes[1];
				topChest.parent = bottomChest;
				trasure.parent = bottomChest;
				ground.parent = bottomChest;
				topChest.setPivotPoint(new BABYLON.Vector3(0,0.66,0));
				

				//start rotation
				let positioX = (scene.pointerX / sceneW) - 0.5;
				bottomChest.rotation.y = Math.sin(positioX) * 0.1 - 1;
				console.log(meshes)
                meshes.forEach(mesh => {
					
                    if(mesh.material) {
						//Add metadata for mouse event
						mesh.metadata = "armorChest";
                    }
					if(mesh.mesh) {
						var shadowGenerator = new BABYLON.ShadowGenerator(1024, pointLight);
						shadowGenerator.addShadowCaster(pointLight);
						shadowGenerator.useExponentialShadowMap = true;
						mesh.receiveShadows = true;

					}
                  })
            });

			//Add mouse logic
			//--click
			scene.onPointerDown = function (evt, pickResult) {
				if (pickResult.pickedMesh && pickResult.pickedMesh.metadata === "armorChest") {
					if(godrays && isOpen && !holdAnimation){
						holdAnimation = true;
						setOpenAnimation(topChest,-0.2, -0.5);
						var anim2 = scene.beginAnimation(topChest, 0, 50, false);
					}
				}	
			};


			//--mouseover
			var onPointerMove = function(e) {
				var result = scene.pick(scene.pointerX, scene.pointerY,null,null,camera);
				let positioX = (scene.pointerX / sceneW) - 0.5;
				let positioY = (scene.pointerY / sceneW) - 0.5;
				if(bottomChest) {
					bottomChest.rotation.y = Math.sin(positioX) * 0.1 - 1;
				}
				
				if (result.hit && result.pickedMesh.metadata == "armorChest") {
					if(!runAnim && !isOpen && !holdAnimation){
						
						setChestAnimation(topChest, 0, -0.2);
						setTimeout(async () => {
							var anim = scene.beginAnimation(godrays, 0, 20, false);
							var anim2 = scene.beginAnimation(topChest, 0, 50, false);
							runAnim = true;
							await anim.waitAsync();
							await anim2.waitAsync();
							runAnim = false;
							isOpen = true;
							
						});
					}
					
				}else {
					if(godrays && isOpen && !runAnim && !holdAnimation){
						setChestAnimation(topChest, -0.2, 0);
						setTimeout(async () => {
							runAnim = true;
							var anim2 = scene.beginAnimation(topChest, 0, 50, false);
							await anim2.waitAsync();
							runAnim = false;
							isOpen = false;
					});
					}
				}
		
			};
			canvas.addEventListener("pointermove", onPointerMove, false);
			

			//GUI
			var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
			var panel = new BABYLON.GUI.StackPanel();
			panel.width = "200px";
			panel.isVertical = true;
			panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
			panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			advancedTexture.addControl(panel);

			var picker1 = new BABYLON.GUI.ColorPicker();
			picker1.value = fireTexture.fireColors[0];
			picker1.height = "100px";
			picker1.width = "100px";
			picker1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
			picker1.onValueChangedObservable.add(function(value) { // value is a color3
				fireTexture.fireColors[1].copyFrom(value);
				console.log(fireTexture.fireColors[1].copyFrom(value))
			});

			var picker2 = new BABYLON.GUI.ColorPicker();
			picker2.value = fireTexture.fireColors[1];
			picker2.height = "100px";
			picker2.width = "100px";
			picker2.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
			picker2.onValueChangedObservable.add(function(value) { // value is a color3
				fireTexture.fireColors[1].copyFrom(value);
			});

			var picker3 = new BABYLON.GUI.ColorPicker();
			picker3.value = fireTexture.fireColors[2];
			picker3.height = "100px";
			picker3.width = "100px";
			picker3.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
			picker3.onValueChangedObservable.add(function(value) { // value is a color3
				fireTexture.fireColors[2].copyFrom(value);
			});

			var picker4 = new BABYLON.GUI.ColorPicker();
			picker4.value = fireTexture.fireColors[3];
			picker4.height = "100px";
			picker4.width = "100px";
			picker4.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
			picker4.onValueChangedObservable.add(function(value) { // value is a color3
				fireTexture.fireColors[3].copyFrom(value);
			});

			var picker5 = new BABYLON.GUI.ColorPicker();
			picker5.value = fireTexture.fireColors[4];
			picker5.height = "100px";
			picker5.width = "100px";
			picker5.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
			picker5.onValueChangedObservable.add(function(value) { // value is a color3
				fireTexture.fireColors[4].copyFrom(value);
			});

			var picker6 = new BABYLON.GUI.ColorPicker();
			picker6.value = fireTexture.fireColors[5];
			picker6.height = "100px";
			picker6.width = "100px";
			picker6.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
			picker6.onValueChangedObservable.add(function(value) { 
				fireTexture.fireColors[5].copyFrom(value);
			});

			panel.addControl(picker1);    
			panel.addControl(picker2);    
			panel.addControl(picker3);    
			panel.addControl(picker4);    
			panel.addControl(picker5);    
			panel.addControl(picker6);

			//LightPanel
			var panelLight = new BABYLON.GUI.StackPanel();
			panelLight.width = "200px";
			panelLight.isVertical = true;
			panelLight.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
			panelLight.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			panelLight.ignoreLayoutWarnings = true;
			advancedTexture.addControl(panelLight);
			
			//addPointLight("PointLight_1", new BABYLON.Vector3(2,3,4), advancedTexture, true);

        	return scene;
        }
        
                window.initFunction = async function() {
                    
                    var asyncEngineCreation = async function() {
                        try {
                        return createDefaultEngine();
                        } catch(e) {
                        console.log("the available createEngine function failed. Creating the default engine instead");
                        return createDefaultEngine();
                        }
                    }

                    window.engine = await asyncEngineCreation();
        if (!engine) throw 'engine should not be null.';
        startRenderLoop(engine, canvas);
        window.scene = createScene();};
        initFunction().then(() => {sceneToRender = scene                    
        });

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });

	function addHeader(text, panel){
		let header = new BABYLON.GUI.TextBlock();
		header.text = text;
		header.height = "30px";
		header.color = "white";
		panel.addControl(header); 
	}

	function addSlider(text, min, max, def, obj, panel, gui){
		var insidePanel = new BABYLON.GUI.StackPanel();
		insidePanel.width = "74px";
		insidePanel.isVertical = true;
		insidePanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
		insidePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
		insidePanel.ignoreLayoutWarnings = true;
		gui.addControl(insidePanel);
		addHeader(text, insidePanel);
		let slider = new BABYLON.GUI.Slider();
		slider.minimum = min;
		slider.maximum = max;
		slider.value = def;
		slider.height = "8px";
		slider.width = "76px";
		slider.onValueChangedObservable.add(function(value) {
		if (obj) {
				switch(text){
					case "X-axis":
						obj.position.x = value;
						break;	
					case "Y-axis":
						obj.position.y = value;
						break;	
					case "Z-axis":
						obj.position.x = value;
						break;
					case "intensity":
						obj.intensity = value;

				}		
			}
		});
		insidePanel.addControl(slider); 
		panel.addControl(insidePanel); 
		
	}

	function addPointLight(text,position, gui, UI){
		let pointLight = new BABYLON.PointLight(text, position, scene);
		pointLight.intensity = 2;
		pointLight.radius = 1;

		if(UI) {
			var panelHorizontal = new BABYLON.GUI.StackPanel();
			panelHorizontal.width = "200px";
			panelHorizontal.isVertical = false;
			panelHorizontal.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
			panelHorizontal.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			panelHorizontal.ignoreLayoutWarnings = true;
			gui.addControl(panelHorizontal);
			addSlider("X-axis", -20,20,0,pointLight,panelHorizontal, gui);
			addSlider("Y-axis", -20,20,0,pointLight,panelHorizontal, gui);
			addSlider("Z-axis", -20,20,0,pointLight,panelHorizontal, gui);
			addSlider("intensity", 0,100,1,pointLight,panelHorizontal, gui);
		}
		
	}

	function setAnimation(object){
		//Animation data
		let startFrame = 0;
		let endFrame = 20;
		let frameRate = 20;

		const goldLight = new BABYLON.Animation("godrays", "exposure", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
		
		const keyframes = [];

		keyframes.push({
			frame: startFrame,
			value: 0.04
		});
		keyframes.push({
			frame: endFrame,
			value: 0.27
		});

		goldLight.setKeys(keyframes);
		var easingFunction = new BABYLON.CircleEase();
		easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
	//	goldLight.setEasingFunction(easingFunction);
		object.animations.push(goldLight);

	}

	function setChestAnimation(object,startValue, finishValue){
		//Animation data
		let startFrame = 0;
		let endFrame = 50;
		let frameRate = 30;

		const chest = new BABYLON.Animation("chest", "rotation.z", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
		
		const keyframes = [];

		keyframes.push({
			frame: startFrame,
			value: startValue
		});
		keyframes.push({
			frame: endFrame,
			value: finishValue
		});

		chest.setKeys(keyframes);
		var easingFunction = new BABYLON.CircleEase();
		easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
		chest.setEasingFunction(easingFunction);
		object.animations.push(chest);

	}

	function setOpenAnimation(object,startValue, finishValue){
		//Animation data
		let startFrame = 0;
		let endFrame = 50;
		let frameRate = 30;

		const chest = new BABYLON.Animation("fullOpen", "rotation.z", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
		
		const keyframes = [];

		keyframes.push({
			frame: startFrame,
			value: startValue
		});
		keyframes.push({
			frame: endFrame,
			value: finishValue
		});

		chest.setKeys(keyframes);
		var easingFunction = new BABYLON.CircleEase();
		easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
		chest.setEasingFunction(easingFunction);
		object.animations.push(chest);

	}