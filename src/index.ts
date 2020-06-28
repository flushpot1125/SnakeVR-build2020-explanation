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
  ExecuteCodeAction,
  Space
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
let snakeSpeed = 1;//スピード早すぎて検証しづらかったので緩めました
let attempts = 0;
let gameText = new TextBlock();

enum Direction  {UP,DOWN,RIGHT,LEFT};//キーボード入力のために追加

function createScene(): Scene {
  scene = new Scene(engine);
  //create camera
  camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  //camera.inputs.clear();

  //シーン全体に物理エンジンを追加 cannonjsはjs関係で有名な物理エンジン
  var cannonPlugin = new CannonJSPlugin(true, 10, cannon);
  scene.enablePhysics(new Vector3(0, 0, 0), cannonPlugin);

  snake = createSnake(scene);
  var vrHelper = scene.createDefaultVRExperience();//この宣言でVR対応する

  //大きな箱状のステージを作成
  createBoxEnv(scene, snake);
  addLabelToScene();
  registerSnakeController(vrHelper);

  gameText.text = "Press right trigger or space key to play game";//スペースキーでもゲーム開始することを追加
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
  //  x=y=0, z=100;
    x=y=0, z=1;
  }else if (snakeStep==Direction.DOWN){
   // x=y=0, z=-100;
    x=y=0, z=-1;
  }else if (snakeStep==Direction.RIGHT){
   // x=100,y=z=0;
    x=1,y=z=0;
  }else if (snakeStep=Direction.LEFT){
   // x=-100,y,z=0;
    x=-1,y,z=0;
  }
  //Animation.CreateAndStartAnimationを使うか、snake.translateのどちらを使っても移動は実現できる
  //Animation.CreateAndStartAnimationの場合、指定方向に等速直線移動  
  //snake.translateだと、ボタンを押したときだけSnakeが移動。x,zの変位量は1程度がよい
  //webVRController.onTriggerStateChangedObservableでも同様
  /*
  Animation.CreateAndStartAnimation(
    "anim",
    snake,
    "position",
    snakeSpeed,
    100,
    snake.position,
    new Vector3(x,y,z),
    Animation.ANIMATIONLOOPMODE_CYCLE
  );
  */
  snake.translate( new Vector3(x,y,z),6,Space.WORLD);

}


function registerSnakeController(vrHelper) {
  let speedDelta = 60 / 1000;
  let deltaTime = engine.getDeltaTime();
  let distance = snakeSpeed * speedDelta * deltaTime;

  //以下はVRコントローラの入力を書く時の定型的な書き方
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

