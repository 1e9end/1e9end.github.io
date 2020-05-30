// Setup
var canvas = document.querySelector('canvas');
var gl = canvas.getContext('webgl');

// Browser doesn't support WebGL, log error and stop program
if (!gl){
    console.log('WebGL not supported');
    alert('WebGL not supported');

    throw new Error('WebGL not supported\nStop being caveman and upgrade browser');
}

// Create a shader function
function createShader(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Checks for success
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        return shader;
    }

    // If failed, log the error and delete the shader to prevent error
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, shaders){
    var program = gl.createProgram();
    for (var i = 0; i < shaders.length; i++){
        gl.attachShader(program, shaders[i]);
    }
    gl.linkProgram(program);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function createBuffer(gl, type, data, draw){
    var buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, draw);

    return buffer;
}

function enableAttrib(gl, program, type, attrib, buffer){
    var location = gl.getAttribLocation(program, attrib);
    gl.enableVertexAttribArray(location);
    gl.bindBuffer(type, buffer);

    return location;
}

// x, y, is center of the cuboid :P
function createCuboid (x, y, z, w, h, d){
    // Convert to top left back
    x = x - w/2;
    y = y + h/2;
    z = z - d/2;

    return [
        // back face
        x, y, z,
        x, y - h, z,
        x + w, y, z,
        
        x + w, y, z,
        x, y - h, z,
        x + w, y - h, z,
        

        // right face
        x + w, y, z,
        x + w, y - h, z,
        x + w, y, z + d,

        x + w, y - h, z + d,
        x + w, y, z + d,
        x + w, y - h, z,
        
        // front face
        x, y, z + d,
        x + w, y, z + d,
        x, y - h, z + d,
        
        x + w, y - h, z + d,
        x, y - h, z + d,
        x + w, y, z + d,

        // left face
        x, y, z,
        x, y, z + d,
        x, y - h, z,

        x, y - h, z + d,
        x, y - h, z,
        x, y, z + d,

        // top face
        x, y, z, 
        x + w, y, z,
        x + w, y, z + d,

        x, y, z,
        x + w, y, z + d,
        x, y, z + d,
        
        // bottom face
        x, y - h, z, 
        x + w, y - h, z + d,
        x + w, y - h, z,
        
        x, y - h, z,
        x, y - h, z + d,
        x + w, y - h, z + d,
    ];
}

function createPyramid (x, y, z, l){
    var xadd = l/2;
    return [
        // front
        x, y + l, z
        // left
        
        // right

        // bottom

    ];
}

(function main(){
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, document.querySelector("#vshader").text);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, document.querySelector("#fshader").text);

    // Create program and attach shaders
    var program = createProgram(gl, [vertexShader, fragmentShader]);

    // Create Shape Buffer
    var vertexData = createCuboid(0, 0, 0, 1, 1, 1);

    // We define the colors of the vertices of the triangles, then interpolate the values to get a gradient
    var colorData = [];

    for (var i = 0; i < 6; i++){
        var faceColor = [Math.random(), Math.random(), Math.random()];
        for (var vertex = 0; vertex < 6; vertex ++){
            colorData.push(faceColor[0], faceColor[1], faceColor[2]);
        }
    }

    var {mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4} = glMatrix;

    // Create buffers
    var positionBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    var colorBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

    // The rect dimensions of the clip space canvas (fills screen)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Enable vertex attributes (just enable positionBuffer I think)
    // get position attribute of program as defined earlier
    var positionLocation = enableAttrib(gl, program, gl.ARRAY_BUFFER, `position`, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);


    var colorLocation = enableAttrib(gl, program, gl.ARRAY_BUFFER, `color`, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

    // use our program
    gl.useProgram(program);

    // culls faces for efficiency
    
    gl.enable(gl.DEPTH_TEST);
    
    

    // Uniforms must be used after start
    var uniformLocations = {
        matrix: gl.getUniformLocation(program, `matrix`),
    };

    var matrix = mat4.create();

    var projection = mat4.create();
    mat4.perspective(projection, 
        75 * Math.PI/180,
        1,
        1e-4,
        1e4
    );
    
    var final = mat4.create();
    
    mat4.translate(matrix, matrix, [.3, .3, -5]);

    (function animate(){
        requestAnimationFrame(animate);
        mat4.rotateZ(matrix, matrix, Math.PI/2/70);
        mat4.rotateY(matrix, matrix, Math.PI/2/70);
        mat4.rotateX(matrix, matrix, Math.PI/2/70);

        mat4.multiply(final, projection, matrix);
        gl.uniformMatrix4fv(uniformLocations.matrix, false, final);

        gl.drawArrays(gl.TRIANGLES, 0, vertexData.length/3);
    })();
})()
