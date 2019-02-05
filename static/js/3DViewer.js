class SceneView{ 
  constructor(canvasID){
    this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor(0x3355aa, 0.5)
    this.renderer.antialias = true

    parent = $('#'+canvasID)


    var size = this.getShortestSide(parent.width(), parent.height())

    //FOV, Aspect Ratio, Near, Far
    this.camera = new THREE.PerspectiveCamera(75, 1.0, 0.1, 100);
		this.renderer.setSize(size, size);
		$('#'+canvasID)[0].appendChild( this.renderer.domElement );

		this.zoomLevel = 15
    this.animating = true
    this.cameraFocus = [0,0,0]


    var axesHelper = new THREE.AxesHelper(3);
    this.scene.add(axesHelper);

		this.animate();
  }

  getShortestSide(width, height){
    if( width <= height){
      return width
    }
    else{
      return height
    }
  }

  setAnimating(state){
    this.animating = state
  }

  moveCameraUp(){
    this.cameraFocus[1] += 0.5
    this.centerCamera()
    this.camera.translateZ(this.zoomLevel)
  }
  moveCameraDown(){
    this.cameraFocus[1] -= 0.5
    this.centerCamera()
    this.camera.translateZ(this.zoomLevel)
  }

  moveCameraLeft(){
    this.cameraFocus[0] -= 0.5
    this.centerCamera()
    this.camera.translateZ(this.zoomLevel)
  }
  moveCameraRight(){
    this.cameraFocus[0] += 0.5
    this.centerCamera()
    this.camera.translateZ(this.zoomLevel)
  }

  zoomIn(){
    this.zoomLevel -= 1
    if(this.zoomLevel < 0){
      this.zoomLevel = 0
    }

    this.centerCamera()
    this.camera.translateZ(this.zoomLevel)
  }
  zoomOut(){
    this.zoomLevel += 1

    this.centerCamera()
    this.camera.translateZ(this.zoomLevel)
  }

  centerCamera(){
    this.camera.position.x = this.cameraFocus[0]
    this.camera.position.y = this.cameraFocus[1]
    this.camera.position.z = this.cameraFocus[2]
  }

  animate(){
    requestAnimationFrame(()=>this.animate());

    if(this.animating){
      this.centerCamera()
      this.camera.rotation.y += 0.005
      this.camera.translateZ(this.zoomLevel)
    }

    this.renderer.render( this.scene, this.camera );
  }

  createCone(radius, height, colour=0xff0000){
    var geometry = new THREE.ConeGeometry(radius, height, 8)
    var material = new THREE.MeshBasicMaterial({color: colour})
    var cone = new THREE.Mesh(geometry, material)
    this.scene.add(cone)
    return cone
  }

  createRoom(width, height, depth, colour=0x00ff00, lineColour=0x22ff22){
    var geometry = new THREE.BoxGeometry( width, height, depth );
    var material = new THREE.MeshBasicMaterial( { color: colour } );
    material.side = THREE.BackSide
    var cube = new THREE.Mesh( geometry, material );

    var edges = new THREE.EdgesGeometry(new THREE.BoxGeometry( width-0.01, height-0.01, depth-0.01 ));
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: lineColour, linewidth: 10 } ));
    this.scene.add( line );

    line.parent = cube
    this.scene.add( cube );
    return cube
  }

  createBox(width, height, depth, colour=0x00ff00){
    var geometry = new THREE.BoxGeometry( width, height, depth );
    var material = new THREE.MeshBasicMaterial( { color: colour } );
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
    return cube
  }

  createSphere(radius, colour=0x00ff00, inverted=false, low_res=false){
    var rings = 16
    var segments = 12
    if(low_res){
      rings = 4
      segments = 3
    }
    var geometry = new THREE.SphereGeometry( radius, rings, segments );
		var material = new THREE.MeshBasicMaterial( { color: colour } );
    if(inverted){
      material.side = THREE.BackSide
    }

		var sphere = new THREE.Mesh( geometry, material );
		this.scene.add( sphere );
    return sphere
  }
}

sceneView = null
$(document).ready(function(){
  sceneView = new SceneView('3js-container')

  $('#3d-cam-up').click(function(){ sceneView.moveCameraUp() })
  $('#3d-cam-down').click(function(){ sceneView.moveCameraDown() })
  $('#3d-cam-left').click(function(){ sceneView.moveCameraLeft() })
  $('#3d-cam-right').click(function(){ sceneView.moveCameraRight() })
  $('#3d-zoom-in').click(function(){ sceneView.zoomIn() })
  $('#3d-zoom-out').click(function(){ sceneView.zoomOut() })
  $('#3d-stop-anim').click(function(){ sceneView.setAnimating(false) })
  $('#3d-start-anim').click(function(){ sceneView.setAnimating(true) })
})
