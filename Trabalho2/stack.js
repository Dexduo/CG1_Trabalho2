let 
		gl,
		prog,
		camera,
		camPos,
		camUp,
		camLookAt,
		canvas,
		ambient,
		diffuse,
		specular,
		lightPos,
		boxGeometry,
		mproj,
		stackPos = 1,
		affectedByPhysics,
		currentDir = "z";
		stack = [],
		overhangs = [],
		angle = 0.0,
		moveRate = 1.0, 
		speed = 20,
		score = 0;
;

let camSpeed = 0.1; // Velocidade de movimento
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Variáveis globais para controlar a câmera
// var cameraPos = [0, 1, 5];    // Posição inicial da câmera
// var cameraFront = [0, 0, -1]; // Direção que a câmera está apontando
// var cameraUp = [0, 1, 0];     // Direção "para cima"
var yaw = -90.0;  // Rotação horizontal da câmera
var pitch = 0.0;  // Rotação vertical da câmera
var speedMouse = 0.05; // Velocidade de movimento
var sensitivity = 0.5; // Sensibilidade do 

window.addEventListener('keydown', function(event) {
	if (event.key === 'w') moveForward = true;
	if (event.key === 's') moveBackward = true;
	if (event.key === 'a') moveLeft = true;
	if (event.key === 'd') moveRight = true;
  });
  
  window.addEventListener('keyup', function(event) {
	if (event.key === 'w') moveForward = false;
	if (event.key === 's') moveBackward = false;
	if (event.key === 'a') moveLeft = false;
	if (event.key === 'd') moveRight = false;
  });


// Listener para o movimento do mouse
document.addEventListener('mousemove', function(event) {
    let xoffset = event.movementX * sensitivity;
    let yoffset = event.movementY * sensitivity;

    yaw += xoffset;
    pitch -= yoffset;

    // Limitar o "pitch" para evitar inversão de câmera
    if (pitch > 89.0) pitch = 89.0;
    if (pitch < -89.0) pitch = -89.0;

    // Atualizar a direção da câmera com base no "yaw" e "pitch"
    let front = [
        Math.cos(rad(yaw)) * Math.cos(rad(pitch)),
        Math.sin(rad(pitch)),
        Math.sin(rad(yaw)) * Math.cos(rad(pitch))
    ];
    camLookAt = math.divide(front, math.norm(front));
});



  function updateCamera() {
	let forwardDir = math.subtract(camLookAt, camPos);
	const length = math.norm(forwardDir); // Calcula o comprimento do vetor
	forwardDir = math.multiply(forwardDir, 1 / length); // Normaliza o vetor

  
	const upLength = math.norm(camUp);
	camUp = math.multiply(camUp, 1 / upLength);

	let rightDir = math.cross(forwardDir, camUp); // Vetor à direita da câmera
	const rightLength = math.norm(rightDir);
	rightDir = math.multiply(rightDir, 1 / rightLength); // Normaliza o vetor à direita
  
	if (moveForward) {
	  camPos = math.add(camPos, math.multiply(forwardDir, camSpeed));
	}
	if (moveBackward) {
	  camPos = math.subtract(camPos, math.multiply(forwardDir, camSpeed));
	}
	if (moveLeft) {
	//   camPos = math.subtract(camPos, math.multiply(rightDir, camSpeed));
		 camPos = math.subtract(camPos, math.multiply([1, 0, 0], camSpeed));
	}
	if (moveRight) {
	  console.log(rightDir);
	//   rightDir = math.subtract(rightDir, -1);
	//   camPos = math.add(camPos, math.multiply(rightDir, camSpeed));
		camPos = math.add(camPos, math.multiply([1, 0, 0], camSpeed));
	}
  
	// Atualize apenas o lookAt quando a posição da câmera mudar
	camLookAt = math.add(camPos, forwardDir);
	camUp = [camPos[0], camPos[1] + 1, camPos[2]];
}



const loadImage = path => 
{
  return new Promise((resolve, reject) => 
  {
    const img = new Image()
    
    img.crossOrigin = 'Anonymous' // to avoid CORS if used with Canvas
    img.src = path
    
    img.onload = () => 
    {
      resolve(img)
    }
    
    img.onerror = e => 
    {
      reject(e)
    }
  })
}

function resizeCanvas() 
{
  const canvas = document.getElementById('glcanvas');
  
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	mproj = createPerspective(20, gl.canvas.width / gl.canvas.height, 0.1, 1e4);

	const u_viewportDimensions = gl.getUniformLocation(prog, "u_viewportDimensions");
	gl.uniform2f(u_viewportDimensions, width, height);
}

function setup() 
{
	affectedByPhysics = false;

	canvas = document.getElementById("glcanvas");
	gl = getGL(canvas);

	if (gl) 
	{
		const vtxshSource = loadSource("./vtxsh.glsl");
		const fragshSource = loadSource("./fragsh.glsl");

		const vtxsh = createShader(gl, gl.VERTEX_SHADER, vtxshSource);
		const fragsh = createShader(gl, gl.FRAGMENT_SHADER, fragshSource);

		prog = createProgram(gl, vtxsh, fragsh);

		gl.useProgram(prog);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		
		// gl.clearColor(0.8705883, 0.3647059, 0.5137255, 1.0);
		gl.clearColor(0.913725, 0.894117, 0.921568, 1.0);
		
		gl.enable(gl.BLEND);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
		configScene();
		
	}
	else 
	{
		console.error("Error loading WebGL context");
	
	}
}

function reset() 
{
	// resetCam();

	stackPos = 1;
	stack = [];

	document.getElementById('score').innerHTML = (stackPos - 1).toString().padStart(2, '0');

	stack.push({
		translation: [0.0, 1.20,  0.0],
		scaling: [1.0, 1.0, 1.0],
		rotation: [0.0, 0.0, 0.0],
		stackPos: stackPos
	});

	// stack.push({
	// 	translation: [0.0, 1.50,  -3.0],
	// 	scaling: [1.0, 1.0, 1.0],
	// 	rotation: [0.0, 0.0, 0.0],
	// 	stackPos: stackPos
	// });

	currentDir = "z";
	angle = 0.0;
	moveRate = 1.0; 
	speed = 20;
}

function checkOverlap()
{
	const topLayer = stack[stack.length - 1];
	const previousLayer = stack[stack.length - 2];

	const direction = currentDir;

	var delta;
	var size;

	if (currentDir === "x")
	{
		delta = topLayer.translation[0] - previousLayer.translation[0];
		size = topLayer.scaling[0];
	}
	else
	{
		delta = topLayer.translation[2] - previousLayer.translation[2];
		size = topLayer.scaling[2];
	}

	const overhangSize = math.abs(delta);
	const out_overlap = size - overhangSize;

	if (out_overlap > 0)
	{
		const nextBox = cutBox(out_overlap, delta);

		addLayer(nextBox);

		return true;
	}
	else
		return false;

}

function cutBox(overlap, delta)
{
  var topLayer = stack[stack.length - 1];

	const direction = currentDir;
  const newWidth = direction == "x" ? overlap : topLayer.scaling[0];
  const newDepth = direction == "z" ? overlap : topLayer.scaling[2];

  const dir = direction == "x" ? 0 : 2;

  topLayer.scaling[0] = newWidth;
  topLayer.scaling[2] = newDepth;

  topLayer.scaling[dir] = overlap;

  var newTop = JSON.parse(JSON.stringify(topLayer));

  return newTop;
}

function flipCurrentDir()
{
	currentDir = currentDir === "x" ? "z" : "x";
}

function addLayer(info)
{
	info.translation[1] += 0.3;

	if (currentDir === "z")
		info.translation[0] = -3;
	else
		info.translation[2] = -3;

	flipCurrentDir();

	camPos = math.multiply(translate(0.0, 0.3, 0.0), [...camPos, ...[1]]).toArray().slice(0, 3);
	camLookAt = math.multiply(translate(0.0, 0.3, 0.0), [...camLookAt, ...[1]]).toArray().slice(0, 3);
  camUp = math.multiply(translate(0.0, 0.3, 0.0), [...camUp, ...[1]]).toArray().slice(0, 3);

  configCam();

 	stackPos++;

 	if (stackPos % 3 == 0)
 		speed -= 0.5;

 	speed = math.max(speed, 2.0);

 	info.stackPos = stackPos;

 	document.getElementById('score').innerHTML = (stackPos - 1).toString().padStart(2, '0');

 	stack.push(info);

  stack = stack.slice(-6);
}

function resetCam() 
{
	// camPos = [7.0, 6.0, 8.0];
	camPos = [0.0, 6.0, -8.0];
	// camLookAt = [0.0, 2.0, 0.0];
	camLookAt = [0.0, 0.0, 1.0];
	camUp = [camPos[0], camPos[1] + 1, camPos[2]];

	configCam();
}

function configCam() 
{
	camera = createCamera(camPos, camLookAt, camUp);
}

async function configScene() 
{
	resetCam();

	lightPos = [0.0, 0.0, 0.0];

	ambient = 
	{
		color: [1.0, 1.0, 1.0]
	};

	diffuse = 
	{
		color: [1.0, 1.0, 1.0],
		direction: [-1.0, -1.0, -1.0]
	};

	specular = 
	{
		color: [1.0, 1.0, 1.0],
		position: lightPos,
		shininess: 50
	};

	mproj = createPerspective(15, gl.canvas.width / gl.canvas.height, 0.1, 1e4);

	const u_ambientColor = gl.getUniformLocation(prog, "u_ambientColor");
	gl.uniform3fv(u_ambientColor, ambient.color);

	const u_diffuseColor = gl.getUniformLocation(prog, "u_diffuseColor");
	gl.uniform3fv(u_diffuseColor, diffuse.color);	

	const u_specularColor = gl.getUniformLocation(prog, "u_specularColor");
	gl.uniform3fv(u_specularColor, specular.color);
	
	const u_lightPosition = gl.getUniformLocation(prog, "u_lightPosition");
	gl.uniform3fv(u_lightPosition, specular.position);
	
	const u_lightDirection = gl.getUniformLocation(prog, "u_lightDirection");
	gl.uniform3fv(u_lightDirection, diffuse.direction);
	
	const u_shininess = gl.getUniformLocation(prog, "u_shininess");
	gl.uniform1f(u_shininess, specular.shininess);
	
	// boxGeometry = await load3DObject("./flat_box.obj");
	boxGeometry = await load3DObject("./maze_runner_map_normalized.obj");
	plumbobGeometry = await load3DObject("./cube.obj");

	initTexture();
	reset();
	loop();
}

function draw3DObject(object, info, textured) 
{
	const u_stackPos = gl.getUniformLocation(prog, "u_stackPos");
	gl.uniform1f(u_stackPos, info.stackPos / 50.0);

	const u_lightPosition = gl.getUniformLocation(prog, "u_lightPosition");
	gl.uniform3fv(u_lightPosition, specular.position);

	const u_invTranspModelMatrix = gl.getUniformLocation(prog, "u_invTranspModelMatrix");
	const u_modelMatrix = gl.getUniformLocation(prog, "u_modelMatrix");
	const u_MVPMatrix = gl.getUniformLocation(prog, "u_MVPMatrix");
	const u_textured = gl.getUniformLocation(prog, "u_textured");

	const pivot = object.vertices.slice(0, 3);
	const pivotMatrix = translate(-pivot[0], -pivot[1], -pivot[2]);
	
	const pos = info.translation;
	const scalef = info.scaling;
	const rotationf = info.rotation;

	const translation = translate(pos[0], pos[1], pos[2]);
	const scaling = math.multiply(pivotMatrix, scale(scalef[0], scalef[1], scalef[2]), math.inv(pivotMatrix));
	const rotation = rotate(rotationf[0], rotationf[1], rotationf[2]);

	const modelMatrix = math.multiply(translation, scaling, rotation);

	if (textured)
		gl.uniform1i(u_textured, true);
	else
		gl.uniform1i(u_textured, false)
	
	// Aqui só enviamos invertida pois o OpenGL já interpreta como transposta
	gl.uniformMatrix4fv(u_invTranspModelMatrix, gl.FALSE, math.flatten(math.inv(modelMatrix)).toArray());
	gl.uniformMatrix4fv(u_modelMatrix, gl.FALSE, math.flatten(modelMatrix).toArray());

	var MVPMatrix = math.multiply(mproj, camera, modelMatrix);

	gl.uniformMatrix4fv(u_MVPMatrix, gl.FALSE, math.flatten(math.transpose(MVPMatrix)).toArray());

	// Bind vertex buffer
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, object.vertices, gl.STATIC_DRAW);

	var a_position = gl.getAttribLocation(prog, "a_position");
	gl.enableVertexAttribArray(a_position);
	gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
	
	// Bind normals buffer
	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, object.normals, gl.STATIC_DRAW);

	var a_normal = gl.getAttribLocation(prog, "a_normal");
	gl.enableVertexAttribArray(a_normal);
	gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);

	// Bind texture coordinates buffer
	var texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, object.texCoords, gl.STATIC_DRAW);

	var a_texCoord = gl.getAttribLocation(prog, "a_texCoord");
	gl.enableVertexAttribArray(a_texCoord);
	gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, object.indices.length);

	gl.deleteBuffer(normalBuffer);
	gl.deleteBuffer(vertexBuffer);
	gl.deleteBuffer(texCoordBuffer);
}

async function initTexture() 
{
	try 
	{
		var texture = await loadImage("./rubiks_cube.png");
	
	} catch(e) 
	{
		console.error(e);
		return;
	}
	
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
	
	const texPtr = gl.getUniformLocation(prog, "u_tex");
	gl.uniform1i(texPtr, 0);
}

function moveTopLayer()
{
	var top = stack[stack.length - 1];

	if (currentDir === "z") 
	{
		top.translation[2] += moveRate / speed;

		if (math.abs(top.translation[2]) >= 3.01) 
			endGame();
	
	}
	else if (currentDir === "x") 
	{
		top.translation[0] += moveRate / speed;

		if (math.abs(top.translation[0]) >= 3.01) 
			endGame();
	
	}
}

function updateLighting()
{
	var top = stack[stack.length - 1];

	specular.position = [top.translation[0], top.translation[1] + 5, top.translation[2]];
}

function drawBoxes()
{
	// for (var i = 0; i < stack.length; i++) 
	// {
	// 	draw3DObject(boxGeometry, stack[i], false);

	// }
	draw3DObject(boxGeometry, stack[0], false);

}

function drawScoreCube()
{
	draw3DObject(plumbobGeometry, {translation: [0.9, camPos[1] - 1.4, -1.0], scaling: [0.04, 0.04, 0.04], rotation: [0.0, -angle, angle], stackPos: -1}, true);
	angle += 2.5;
}

function handleEvent()
{
	const success = checkOverlap();

	if (!success)
	{
		endGame();
	}
}

function loop() 
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// moveTopLayer();
	
	updateLighting();

	drawBoxes();

	drawScoreCube();

	//
	updateCamera();

	configCam();

	requestAnimationFrame(loop);
}

window.addEventListener('keydown', function(event) 
{
  if (event.key === ' ') 
  {
  	handleEvent();
  }

  if (event.key === 'r')
  {
  	reset();
  }
});

window.addEventListener('mousedown', handleEvent);
window.addEventListener('touchstart', handleEvent);

function endGame()
{
	console.log(stackPos - 1);
	reset();
}