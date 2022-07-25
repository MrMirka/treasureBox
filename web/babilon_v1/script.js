
const canvas = document.getElementById("webgl");
const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});



const createScene = function(){
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2.6, 8, new BABYLON.Vector3(0,1,0), scene);
    //camera.attachControl(canvas, false);
    
    let pointLight = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 0, 0), scene);
    //pointLight.intensity = 10;
    
    

    //add GLTf
    BABYLON.SceneLoader.Append("model/simple_chest/", "scene.gltf", scene, function (meshes) {
            const myMaterial = new BABYLON.StandardMaterial();
            myMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.2, 0.2);
            myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
            myMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);
            
            meshes.meshes.forEach(mesh => {
                if(mesh.material) {
                    mesh.material = myMaterial;
                }
            })
    });
    scene.clearColor = new BABYLON.Color3(1, 0, 0);
    const sphere = new BABYLON.MeshBuilder.CreateSphere("sphere",{diameter: 1}, scene);
    sphere.position = new BABYLON.Vector3(0,1,0);

    //light animation
    let lightNodeMat = new BABYLON.NodeMaterial("lightNodeMat", scene, {emitComments: false});
    let promises = []
    promises.push(lightNodeMat.loadAsync("nodematerial/lightGlowMat.json"))
    Promise.all(promises).then(function() {
        lightNodeMat.build(false);
        sphere.material = lightNodeMat;

        var glowMask = lightNodeMat.getBlockByName("glowMask");
        var emissiveStrength = lightNodeMat.getBlockByName("emissiveStrength");

        var gl = new BABYLON.GlowLayer("glow", scene);
        gl.intensity = 1.25;
        gl.referenceMeshToUseItsOwnMaterial(sphere);

         gl.onBeforeRenderMeshToEffect.add(() => {
            glowMask.value = 1.0;
        });
        gl.onAfterRenderMeshToEffect.add(() => {
            glowMask.value = 0.0;
        }); 
         // flicker animation
         var flickerAnim = new BABYLON.Animation("flickerAnim", "value", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
         //var flickerAnim2 = new BABYLON.Animation("flickerAnim", "intensity", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
         
         var easingFunction = new BABYLON.SineEase();
         easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
         var flickerKeys = [
             {frame: 0, value: 0.2},
             {frame: 5, value: 0.8},
             {frame: 10, value: 2.1},
             {frame: 25, value: 0.8},
             {frame: 30, value: 0.05},
             {frame: 35, value: 0.7},
             {frame: 40, value: 0.3},
             {frame: 55, value: 0.5},
             {frame: 70, value: 0.35},
             {frame: 170, value: 1.0}
         ];  

         pointLight.intensity = 10
         flickerAnim.setKeys(flickerKeys);
         flickerAnim.setEasingFunction(easingFunction);      
         scene.beginDirectAnimation(emissiveStrength, [flickerAnim], 0, flickerKeys[flickerKeys.length - 1].frame, true, 1);
    });

    return scene;
};

const scene = createScene();

 engine.runRenderLoop(()=>{
    scene.render();
})  