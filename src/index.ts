import {
  Scene,
  MeshBuilder,
  Vector3,
  Engine,
  Mesh,
  FreeCamera,
  StickValues,
  WebVRController,
  Animation,
  CannonJSPlugin,
  PhysicsImpostor,
  ExtendedGamepadButton,
  ActionManager,
  ExecuteCodeAction
} from "babylonjs";
import { TextBlock, AdvancedDynamicTexture } from "babylonjs-gui";
import { addLabelToScene, updateScore } from "./score";
import * as cannon from "cannon";

import { createBoxEnv } from "./envBox";
import { createSnake } from "./snake";
import { addNom } from "./noms";

// Get the canvas DOM element
var canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
// Load the 3D engine
var engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});

let camera = null;
let isGameActive = false;
let snake: Mesh = null;
//snake speed is animation frame per second
//let snakeSpeed = 5;
let snakeSpeed = 1;
let attempts = 0;
let gameText = new TextBlock();

enum Direction  {UP,DOWN,RIGHT,LEFT};

function createScene(): Scene {
  scene = new Scene(engine);
  //create camera
  camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  //camera.inputs.clear();

  //add physics engine
  var cannonPlugin = new CannonJSPlugin(true, 10, cannon);
  scene.enablePhysics(new Vector3(0, 0, 0), cannonPlugin);

  snake = createSnake(scene);
 // var vrHelper = scene.createDefaultVRExperience();

  //create box environment
  createBoxEnv(scene, snake);
  addLabelToScene();
 // registerSnakeController(vrHelper);
//  keyboardController(scene);

  gameText.text = "Press right trigger or space key to play game";
  gameText.color = "white";
  gameText.fontSize = 25;
  var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
    "helperText",
    true
  );
  advancedTexture.addControl(gameText);
  return scene;
}

var startGame = () => {
  console.log("start game");
  if (attempts > 0) {
    attempts++;
    snake.isVisible = true;
    snake = createSnake(scene);
  }
  //reset score
  updateScore(0);
  //start movement
  isGameActive = true;
  addNom(scene, snake, snakeSpeed);
  //addAppleNom(scene);
  //addGrapesNom(scene);
  //addOrangeNom(scene);
  gameText.isVisible = false;
};

export function stopGame() {
  isGameActive = false;
  updateScore(0);
  gameText.isVisible = true;
  gameText.text = "Game Over. Press right trigger or space key to try again!";
}

// call the createScene function
var scene = createScene();

document.onkeydown =(e)=>{
  if(e.keyCode == 32){//SPACE
    console.log("Game start!");
    startGame();
  }else if (e.keyCode == 87){ //UP
    moveSnake(Direction.UP);
  }else if (e.keyCode ==83){ //DOWN
    moveSnake(Direction.DOWN);
  }else if (e.keyCode ==68){ //RIGHT
    moveSnake(Direction.RIGHT);
  }else if (e.keyCode ==65){ //LEFT
    moveSnake(Direction.LEFT);
  }
}

// run the render loop
engine.runRenderLoop(function () {
  scene.render();
});
// the canvas/window resize event handler
window.addEventListener("resize", function () {
  engine.resize();
});

function moveSnake(snakeStep:Direction){
  var x,y,z:number;
  if(snakeStep ==Direction.UP){
    x=y=0, z=100;
  }else if (snakeStep==Direction.DOWN){
    x=y=0, z=-100;
  }else if (snakeStep==Direction.RIGHT){
    x=100,y=z=0;
  }else if (snakeStep=Direction.LEFT){
    x=-100,y,z=0;
  }
  Animation.CreateAndStartAnimation(
    "anim",
    snake,
    "position",
    snakeSpeed,
    100,
    snake.position,
 //   new Vector3(x,y,z),
  //  Animation.ANIMATIONLOOPMODE_CONSTANT
    new Vector3(x,y,z)
  //  Animation.ANIMATIONLOOPMODE_CONSTANT
  );
}

function keyboardController(scene){
  let map = {}; //object for multiple key presses
  scene.actionManager = new ActionManager(scene);

  scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, function (evt) {
      map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";

  }));

  scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, function (evt) {
      map[evt.sourceEvent.key] = evt.sourceEvent.type == "keyup";
  }));

  scene.registerAfterRender(function () {

    if ((map["w"] || map["W"])) {
      startGame();
       // sphere.position.z += 0.1;
    };


});
}

function registerSnakeController(vrHelper) {
  let speedDelta = 60 / 1000;
  let deltaTime = engine.getDeltaTime();
  let distance = snakeSpeed * speedDelta * deltaTime;

  vrHelper.onControllerMeshLoaded.add((webVRController: WebVRController) => {
    webVRController.onTriggerStateChangedObservable.add(
      (trigger: ExtendedGamepadButton) => {
        if (webVRController.hand == "right") {
          if (trigger.pressed && !isGameActive) {
            startGame();
          }
        }
      }
    );
    webVRController.onPadValuesChangedObservable.add(
      (stickValues: StickValues) => {
        if (webVRController.hand == "right") {
          if (stickValues.y < 0) {
            console.log("move up");
            Animation.CreateAndStartAnimation(
              "anim",
              snake,
              "position",
              snakeSpeed,
              100,
              snake.position,
              new Vector3(0, 0, 100),
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          } else if (stickValues.y > 0 && stickValues.x < 0) {
            console.log("move down");
            Animation.CreateAndStartAnimation(
              "anim",
              snake,
              "position",
              snakeSpeed,
              100,
              snake.position,
              new Vector3(0, 0, -100),
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
          console.log("right hand joystick");
        } else if ((webVRController.hand = "left")) {
          console.log("left hand joystick");
          console.log("x " + stickValues.x);
          console.log("y " + stickValues.y);
          if (stickValues.x > 0 && stickValues.y > 0) {
            console.log("move right");
            Animation.CreateAndStartAnimation(
              "anim",
              snake,
              "position",
              snakeSpeed,
              100,
              snake.position,
              new Vector3(100, 0, 0),
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            // Animation.CreateMergeAndStartAnimation(
            //   "rotAnim",
            //   snake,
            //   "rotation",
            //   1,
            //   1,
            //   snake.position,
            //   new Vector3(0, 200, 0)
            // );
          }
          //move up
          else if (stickValues.y > 0 && stickValues.x < 0) {
            console.log("move down");
            Animation.CreateAndStartAnimation(
              "anim",
              snake,
              "position",
              snakeSpeed,
              100,
              snake.position,
              new Vector3(0, -100, 0),
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
          //move left
          else if (stickValues.x < 0) {
            console.log("move left");
            Animation.CreateAndStartAnimation(
              "anim",
              snake,
              "position",
              snakeSpeed,
              100,
              snake.position,
              new Vector3(-100, 0, 0),
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
          //move up
          else if (stickValues.y < 0) {
            console.log("move up");
            Animation.CreateAndStartAnimation(
              "anim",
              snake,
              "position",
              snakeSpeed,
              100,
              snake.position,
              new Vector3(0, 100, 0),
              Animation.ANIMATIONLOOPMODE_CONSTANT
            );
          }
          // var sixDofDragBehavior = new SixDofDragBehavior();
          // snake.addBehavior(sixDofDragBehavior);
        }
      }
    );
  });
}

