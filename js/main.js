"use strict"

function createWebGLWithId(id)
{
    const contextNames = [ "webgl2", "webgl", "experimental-webgl" ];

    let canvas = document.getElementById(id);
    if (!canvas)
    {
        console.log("Get canvas with Id: " + id + " failed!");
        return null;
    }

    let gl = null;
    for (let i = 0; i < contextNames.length; i++)
    {
        gl = canvas.getContext(contextNames[i]);
        if (gl)
        {
            console.log("Get WebGL context with " + contextNames[i] + " success!");
            break;
        }
    }

    return gl;
}


function createShaderProgram(gl, shaderSource, type)
{
    let shader = gl.createShader(type);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        console.log("Compile Shader failed: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function createRenderProgram(gl, vertexShaderSource, fragmentShaderSource)
{
    let vertexShader = createShaderProgram(gl, vertexShaderSource, gl.VERTEX_SHADER);
    if (!vertexShader)
        return null;

    let fragmentShader = createShaderProgram(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)
    if (!fragmentShader)
        return null;

    let program = gl.createProgram();
    if (!program)
    {
        console.log("Create Program failed!");
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        console.log("Link Program failed: " + gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

function render(gl)
{
    const vertexShaderSource = 
        "attribute vec4 a_Position;\n" + 
        "attribute vec4 a_Color;\n" + 
        "varying vec4 v_Color;\n" + 
        "uniform mat4 u_MvpMatrix;\n" + 
        "void main() {\n" +
        "  gl_Position = u_MvpMatrix * a_Position;\n" + 
        "  v_Color = a_Color;\n" + 
        "}";

    const fragmentShaderSource = 
        "#ifdef GL_ES\n" + 
        "precision mediump float;\n" + 
        "#endif\n" + 
        "varying vec4 v_Color;\n" + 
        "void main() {\n" + 
        "  gl_FragColor = v_Color;\n" + 
        "}";
    
    let program = createRenderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program)
        return false;

    gl["currentProgrma"] = program;
    gl.useProgram(program);

    /*

           4-----------3
           /|        /|
          / |       / |
        1-----------2 |
         | 8|------|---7
         | /       | /
         |/        |/
        5-----------6

        -1, 1, 1,  // 1 
        1, 1, 1,   // 2
        1, 1, -1,  // 3
        -1, 1, -1, // 4
        -1, -1, 1, // 5
        1, -1, 1,  // 6
        1, -1, -1, // 7
        -1, -1, -1,// 8
    */
    const postionData = new Float32Array([
        -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,      // top  1->2->3->4
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,  // bottom 8->7->6->5
        -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1,  // left 5->1->4->8
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,      // right 2->6->6->3
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,      // front 2->1->5->6
        -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,  // back 4->3->7->8
    ]);

    const colorData = new Float32Array([
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // top red
        0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, // bottom
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // left white
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // right  blue
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // front green
        1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, // back yellow
    ]);

    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,           // top
        4, 5, 6, 4, 6, 7,           // bottom
        8, 9, 10, 8, 10, 11,        // left
        12, 13, 14, 12, 14, 15,     // right
        16, 17, 18, 16, 18, 19,     // front
        20, 21, 22, 20, 22, 23,     // back
    ]);

    let positionBuffer = gl.createBuffer();
    if (!positionBuffer)
    {
        console.log("Create Buffer failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, postionData, gl.STATIC_DRAW);

    let a_Position = gl.getAttribLocation(program, "a_Position");
    if (a_Position < 0)
    {
        console.log("Get Vertex Attribute[a_Position] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    let colorBuffer = gl.createBuffer();
    if (!colorBuffer)
    {
        console.log("Create Buffer failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    let a_Color = gl.getAttribLocation(program, "a_Color");
    if (a_Color < 0)
    {
        console.log("Get Vertex Attribute[a_Color] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    let indexBuffer = gl.createBuffer();
    if (!indexBuffer)
    {
        console.log("Create Buffer failed!");
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    let u_MvpMatrix = gl.getUniformLocation(program, "u_MvpMatrix");
    if (!u_MvpMatrix)
    {
        console.log("Get Uniform[u_MvpMatrix] failed!");
        return false;
    }

    let projMatrix = new Matrix4();
    let viewMatrix = new Matrix4();
    let modelMatrix = new Matrix4();
    
    let rotation = {};
    rotation.xr = 0;
    rotation.yr = 0;
    projMatrix.setPerspective(40, 1, 1, 200);
    viewMatrix.setLookAt(5, 5, 5, 0, 0, 0, 0, 1, 0);
    modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0);
    let mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

    function draw(ev, rotation)
    {
        console.log("keyCode: " + ev.keyCode);

        if (ev.keyCode == 39) // ->
        {
            rotation.yr += 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 37) // <-
        {
            rotation.yr -= 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 38) // ^
        {
            rotation.xr -= 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 40)  // v
        {
            rotation.xr += 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 32)  // space
        {
            rotation.xr = 0;
            rotation.yr = 0;
        }
        else
        {
            return;
        }

        modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0); 
    }

    document.onkeydown = function (ev) { draw(ev, rotation); };
}

function render2(gl)
{
    const vertexShaderSource = 
        "attribute vec4 a_Position;\n" + 
        "attribute vec4 a_Color;\n" + 
        "attribute vec4 a_Normal;\n" + 
        "varying vec4 v_Color;\n" + 
        "uniform mat4 u_MvpMatrix;\n" + 
        "uniform mat4 u_NormalMatrix;\n" + 
        "uniform vec3 u_LightColor;\n" + 
        "uniform vec3 u_LightDirection;\n" + 
        "uniform vec3 u_AmbientLight;\n" + 
        "void main() {\n" +
        "  gl_Position = u_MvpMatrix * a_Position;\n" + 
        "  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n" + 
        //"  vec3 normal = normalize(vec3(a_Normal));\n" + 
        "  vec3 normalizedLightDir = normalize(u_LightDirection);\n" + 
        "  float nDotL = max(dot(normalizedLightDir, normal), 0.0);\n" + 
        "  vec3 ambient = u_AmbientLight * a_Color.rgb;\n" + 
        "  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n" + 
        "  v_Color = vec4(diffuse + ambient, a_Color.a);\n" + 
        "}";

    const fragmentShaderSource = 
        "#ifdef GL_ES\n" + 
        "precision mediump float;\n" + 
        "#endif\n" + 
        "varying vec4 v_Color;\n" + 
        "void main() {\n" + 
        "  gl_FragColor = v_Color;\n" + 
        "}";
    
    let program = createRenderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program)
        return false;

    gl["currentProgrma"] = program;
    gl.useProgram(program);

    /*

           4-----------3
           /|        /|
          / |       / |
        1-----------2 |
         | 8|------|---7
         | /       | /
         |/        |/
        5-----------6

        -1, 1, 1,  // 1 
        1, 1, 1,   // 2
        1, 1, -1,  // 3
        -1, 1, -1, // 4
        -1, -1, 1, // 5
        1, -1, 1,  // 6
        1, -1, -1, // 7
        -1, -1, -1,// 8
    */
    const postionData = new Float32Array([
        -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,      // top  1->2->3->4
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,  // bottom 8->7->6->5
        -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1,  // left 5->1->4->8
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,      // right 2->6->6->3
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,      // front 2->1->5->6
        -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,  // back 4->3->7->8
    ]);

    const colorData = new Float32Array([
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // top red
        0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, // bottom
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // left white
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // right  blue
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // front green
        1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, // back yellow
    ]);

    const normalData = new Float32Array([
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,       // top
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,   // bottom
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,   // left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,       // right
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,       // front
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,   // back
    ]);

    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,           // top
        4, 5, 6, 4, 6, 7,           // bottom
        8, 9, 10, 8, 10, 11,        // left
        12, 13, 14, 12, 14, 15,     // right
        16, 17, 18, 16, 18, 19,     // front
        20, 21, 22, 20, 22, 23,     // back
    ]);

    let positionBuffer = gl.createBuffer();
    if (!positionBuffer)
    {
        console.log("Create Buffer for position failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, postionData, gl.STATIC_DRAW);

    let a_Position = gl.getAttribLocation(program, "a_Position");
    if (a_Position < 0)
    {
        console.log("Get Vertex Attribute[a_Position] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    let colorBuffer = gl.createBuffer();
    if (!colorBuffer)
    {
        console.log("Create Buffer for color failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    let a_Color = gl.getAttribLocation(program, "a_Color");
    if (a_Color < 0)
    {
        console.log("Get Vertex Attribute[a_Color] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    let normalBuffer = gl.createBuffer();
    if (!normalBuffer)
    {
        console.log("Create Buffer for normal failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
    let a_Normal = gl.getAttribLocation(program, "a_Normal");
    if (a_Normal < 0)
    {
        console.log("Get Vertex Attribute[a_Normal] failed!");
        return false;
    }

    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    let indexBuffer = gl.createBuffer();
    if (!indexBuffer)
    {
        console.log("Create Buffer for index failed!");
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Ambient Light Color
    let u_AmbientLight = gl.getUniformLocation(program, "u_AmbientLight");
    if (!u_AmbientLight)
    {
        console.log("Get Uniform[u_AmbientLight] failed!");
        return false;
    }
    const ambientLight = new Float32Array([0.2, 0.2, 0.2]);
    gl.uniform3fv(u_AmbientLight, ambientLight);

    // Parallel Light Color
    let u_LightColor = gl.getUniformLocation(program, "u_LightColor");
    if (!u_LightColor)
    {
        console.log("Get Uniform[u_LightColor] failed!");
        return false;
    }
    const lightColor = new Float32Array([ 1.0, 1.0, 1.0 ]);
    gl.uniform3fv(u_LightColor, lightColor);

    // Parallel Light Direction
    let u_LightDirection = gl.getUniformLocation(program, "u_LightDirection");
    if (!u_LightDirection)
    {
        console.log("Get Uniform[u_LightDirection] failed!");
        return false;
    }
    const lightDirection = new Float32Array([ 5, 5, 5 ]);
    gl.uniform3fv(u_LightDirection, lightDirection);

    let u_MvpMatrix = gl.getUniformLocation(program, "u_MvpMatrix");
    if (!u_MvpMatrix)
    {
        console.log("Get Uniform[u_MvpMatrix] failed!");
        return false;
    }

    let projMatrix = new Matrix4();
    let viewMatrix = new Matrix4();
    let modelMatrix = new Matrix4();
    
    let rotation = {};
    rotation.xr = 0;
    rotation.yr = 0;
    projMatrix.setPerspective(40, 1, 1, 200);
    viewMatrix.setLookAt(5, 5, 5, 0, 0, 0, 0, 1, 0);
    modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0);
    let mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    let u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
    if (!u_NormalMatrix)
    {
        console.log("Get Uniform[u_NormalMatrix] failed!");
        return false;
    }
    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

    function draw(ev, rotation)
    {
        console.log("keyCode: " + ev.keyCode);

        if (ev.keyCode == 39) // ->
        {
            rotation.yr += 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 37) // <-
        {
            rotation.yr -= 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 38) // ^
        {
            rotation.xr -= 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 40)  // v
        {
            rotation.xr += 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 32)  // space
        {
            rotation.xr = 0;
            rotation.yr = 0;
        }
        else
        {
            return;
        }

        modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0); 
    }

    document.onkeydown = function (ev) { draw(ev, rotation); };
}

function render3(gl)
{
    const vertexShaderSource = 
        "attribute vec4 a_Position;\n" + 
        "attribute vec4 a_Color;\n" + 
        "attribute vec4 a_Normal;\n" + 
        "varying vec4 v_Color;\n" + 
        "uniform mat4 u_MvpMatrix;\n" + 
        "uniform mat4 u_ModelMatrix;\n" + 
        "uniform mat4 u_NormalMatrix;\n" + 
        "uniform vec3 u_LightColor;\n" + 
        "uniform vec3 u_LightPosition;\n" + 
        "uniform vec3 u_AmbientLight;\n" + 
        "void main() {\n" +
        "  gl_Position = u_MvpMatrix * a_Position;\n" + 
        "  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n" + 
        "  vec3 position = (u_ModelMatrix * a_Position).xyz;\n" + 
        "  vec3 normalizedLightDir = normalize(u_LightPosition - position);\n" + 
        "  float nDotL = max(dot(normalizedLightDir, normal), 0.0);\n" + 
        "  vec3 ambient = u_AmbientLight * a_Color.rgb;\n" + 
        "  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n" + 
        "  v_Color = vec4(diffuse + ambient, a_Color.a);\n" + 
        "}";

    const fragmentShaderSource = 
        "#ifdef GL_ES\n" + 
        "precision mediump float;\n" + 
        "#endif\n" + 
        "varying vec4 v_Color;\n" + 
        "void main() {\n" + 
        "  gl_FragColor = v_Color;\n" + 
        "}";
    
    let program = createRenderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program)
        return false;

    gl["currentProgrma"] = program;
    gl.useProgram(program);

    /*

           4-----------3
           /|        /|
          / |       / |
        1-----------2 |
         | 8|------|---7
         | /       | /
         |/        |/
        5-----------6

        -1, 1, 1,  // 1 
        1, 1, 1,   // 2
        1, 1, -1,  // 3
        -1, 1, -1, // 4
        -1, -1, 1, // 5
        1, -1, 1,  // 6
        1, -1, -1, // 7
        -1, -1, -1,// 8
    */
    const postionData = new Float32Array([
        -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,      // top  1->2->3->4
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,  // bottom 8->7->6->5
        -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1,  // left 5->1->4->8
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,      // right 2->6->6->3
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,      // front 2->1->5->6
        -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,  // back 4->3->7->8
    ]);

    const colorData = new Float32Array([
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // top red
        0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, // bottom
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // left white
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // right  blue
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // front green
        1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, // back yellow
    ]);

    const normalData = new Float32Array([
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,       // top
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,   // bottom
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,   // left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,       // right
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,       // front
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,   // back
    ]);

    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,           // top
        4, 5, 6, 4, 6, 7,           // bottom
        8, 9, 10, 8, 10, 11,        // left
        12, 13, 14, 12, 14, 15,     // right
        16, 17, 18, 16, 18, 19,     // front
        20, 21, 22, 20, 22, 23,     // back
    ]);

    let positionBuffer = gl.createBuffer();
    if (!positionBuffer)
    {
        console.log("Create Buffer for position failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, postionData, gl.STATIC_DRAW);

    let a_Position = gl.getAttribLocation(program, "a_Position");
    if (a_Position < 0)
    {
        console.log("Get Vertex Attribute[a_Position] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    let colorBuffer = gl.createBuffer();
    if (!colorBuffer)
    {
        console.log("Create Buffer for color failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    let a_Color = gl.getAttribLocation(program, "a_Color");
    if (a_Color < 0)
    {
        console.log("Get Vertex Attribute[a_Color] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    let normalBuffer = gl.createBuffer();
    if (!normalBuffer)
    {
        console.log("Create Buffer for normal failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
    let a_Normal = gl.getAttribLocation(program, "a_Normal");
    if (a_Normal < 0)
    {
        console.log("Get Vertex Attribute[a_Normal] failed!");
        return false;
    }

    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    let indexBuffer = gl.createBuffer();
    if (!indexBuffer)
    {
        console.log("Create Buffer for index failed!");
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Ambient Light Color
    let u_AmbientLight = gl.getUniformLocation(program, "u_AmbientLight");
    if (!u_AmbientLight)
    {
        console.log("Get Uniform[u_AmbientLight] failed!");
        return false;
    }
    const ambientLight = new Float32Array([0.2, 0.2, 0.2]);
    gl.uniform3fv(u_AmbientLight, ambientLight);

    // Parallel Light Color
    let u_LightColor = gl.getUniformLocation(program, "u_LightColor");
    if (!u_LightColor)
    {
        console.log("Get Uniform[u_LightColor] failed!");
        return false;
    }
    const lightColor = new Float32Array([ 1.0, 1.0, 1.0 ]);
    gl.uniform3fv(u_LightColor, lightColor);

    // Parallel Light Position
    let u_LightPosition = gl.getUniformLocation(program, "u_LightPosition");
    if (!u_LightPosition)
    {
        console.log("Get Uniform[u_LightPosition] failed!");
        return false;
    }
    const lightPosition = new Float32Array([ 0, 0, 4 ]);
    gl.uniform3fv(u_LightPosition, lightPosition);

    let u_MvpMatrix = gl.getUniformLocation(program, "u_MvpMatrix");
    if (!u_MvpMatrix)
    {
        console.log("Get Uniform[u_MvpMatrix] failed!");
        return false;
    }

    let projMatrix = new Matrix4();
    let viewMatrix = new Matrix4();
    let modelMatrix = new Matrix4();
    
    let rotation = {};
    rotation.xr = 0;
    rotation.yr = 0;
    projMatrix.setPerspective(40, 1, 1, 200);
    viewMatrix.setLookAt(5, 5, 5, 0, 0, 0, 0, 1, 0);
    modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0).scale(1.2, 1.2, 1.2);
    let mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    let u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
    if (!u_ModelMatrix)
    {
        console.log("Get Uniform[u_ModelMatrix] failed!");
        return false;
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    let u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
    if (!u_NormalMatrix)
    {
        console.log("Get Uniform[u_NormalMatrix] failed!");
        return false;
    }
    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

    function draw(ev, rotation)
    {
        console.log("keyCode: " + ev.keyCode);

        if (ev.keyCode == 39) // ->
        {
            rotation.yr += 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 37) // <-
        {
            rotation.yr -= 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 38) // ^
        {
            rotation.xr -= 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 40)  // v
        {
            rotation.xr += 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 32)  // space
        {
            rotation.xr = 0;
            rotation.yr = 0;
        }
        else
        {
            return;
        }

        modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0).scale(1.2, 1.2, 1.2);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0); 
    }

    document.onkeydown = function (ev) { draw(ev, rotation); };
}

function render4(gl)
{
    const vertexShaderSource = 
        "attribute vec4 a_Position;\n" + 
        "attribute vec4 a_Color;\n" + 
        "attribute vec3 a_Normal;\n" + 
        "varying vec3 v_Position;\n" + 
        "varying vec4 v_Color;\n" + 
        "varying vec3 v_Normal;\n" + 
        "uniform mat4 u_ModelMatrix;\n" + 
        "uniform mat4 u_NormalMatrix;\n" + 
        "uniform mat4 u_MvpMatrix;\n" + 
        "void main() {\n" +
        "  gl_Position = u_MvpMatrix * a_Position;\n" + 
        "  v_Position = (u_ModelMatrix * a_Position).xyz;\n" + 
        "  v_Color = a_Color;\n" + 
        "  v_Normal = (u_NormalMatrix * vec4(a_Normal, 0.0)).xyz;\n" + 
        "}";

    const fragmentShaderSource = 
        "#ifdef GL_ES\n" + 
        "precision mediump float;\n" + 
        "#endif\n" + 
        "varying vec3 v_Position;\n" + 
        "varying vec4 v_Color;\n" + 
        "varying vec3 v_Normal;\n" + 
        "uniform vec3 u_LightColor;\n" + 
        "uniform vec3 u_LightPosition;\n" + 
        "uniform vec3 u_AmbientLight;\n" + 
        "void main() {\n" + 
        "  vec3 normalizedLightDir = normalize(u_LightPosition - v_Position);\n" + 
        "  vec3 normal = normalize(v_Normal);\n" + 
        "  float nDotL = max(dot(normalizedLightDir, normal), 0.0);\n" + 
        "  vec3 ambient = u_AmbientLight * v_Color.rgb;\n" + 
        "  vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n" + 
        "  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n" + 
        "}";
    
    let program = createRenderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program)
        return false;

    gl["currentProgrma"] = program;
    gl.useProgram(program);

    /*

           4-----------3
           /|        /|
          / |       / |
        1-----------2 |
         | 8|------|---7
         | /       | /
         |/        |/
        5-----------6

        -1, 1, 1,  // 1 
        1, 1, 1,   // 2
        1, 1, -1,  // 3
        -1, 1, -1, // 4
        -1, -1, 1, // 5
        1, -1, 1,  // 6
        1, -1, -1, // 7
        -1, -1, -1,// 8
    */
    const postionData = new Float32Array([
        -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,      // top  1->2->3->4
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,  // bottom 8->7->6->5
        -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1,  // left 5->1->4->8
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,      // right 2->6->6->3
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,      // front 2->1->5->6
        -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,  // back 4->3->7->8
    ]);

    const colorData = new Float32Array([
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // top red
        0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, // bottom
        1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // left white
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // right  blue
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // front green
        1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, // back yellow
    ]);

    const normalData = new Float32Array([
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,       // top
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,   // bottom
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,   // left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,       // right
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,       // front
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,   // back
    ]);

    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,           // top
        4, 5, 6, 4, 6, 7,           // bottom
        8, 9, 10, 8, 10, 11,        // left
        12, 13, 14, 12, 14, 15,     // right
        16, 17, 18, 16, 18, 19,     // front
        20, 21, 22, 20, 22, 23,     // back
    ]);

    let positionBuffer = gl.createBuffer();
    if (!positionBuffer)
    {
        console.log("Create Buffer for position failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, postionData, gl.STATIC_DRAW);

    let a_Position = gl.getAttribLocation(program, "a_Position");
    if (a_Position < 0)
    {
        console.log("Get Vertex Attribute[a_Position] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    let colorBuffer = gl.createBuffer();
    if (!colorBuffer)
    {
        console.log("Create Buffer for color failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    let a_Color = gl.getAttribLocation(program, "a_Color");
    if (a_Color < 0)
    {
        console.log("Get Vertex Attribute[a_Color] failed!");
        return false;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    let normalBuffer = gl.createBuffer();
    if (!normalBuffer)
    {
        console.log("Create Buffer for normal failed!");
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
    let a_Normal = gl.getAttribLocation(program, "a_Normal");
    if (a_Normal < 0)
    {
        console.log("Get Vertex Attribute[a_Normal] failed!");
        return false;
    }

    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    let indexBuffer = gl.createBuffer();
    if (!indexBuffer)
    {
        console.log("Create Buffer for index failed!");
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Ambient Light Color
    let u_AmbientLight = gl.getUniformLocation(program, "u_AmbientLight");
    if (!u_AmbientLight)
    {
        console.log("Get Uniform[u_AmbientLight] failed!");
        return false;
    }
    const ambientLight = new Float32Array([0.1, 0.1, 0.1]);
    gl.uniform3fv(u_AmbientLight, ambientLight);

    // Parallel Light Color
    let u_LightColor = gl.getUniformLocation(program, "u_LightColor");
    if (!u_LightColor)
    {
        console.log("Get Uniform[u_LightColor] failed!");
        return false;
    }
    const lightColor = new Float32Array([ 1.0, 1.0, 1.0 ]);
    gl.uniform3fv(u_LightColor, lightColor);

    // Parallel Light Position
    let u_LightPosition = gl.getUniformLocation(program, "u_LightPosition");
    if (!u_LightPosition)
    {
        console.log("Get Uniform[u_LightPosition] failed!");
        return false;
    }
    const lightPosition = new Float32Array([ 0, 0, 3 ]);
    gl.uniform3fv(u_LightPosition, lightPosition);

    let u_MvpMatrix = gl.getUniformLocation(program, "u_MvpMatrix");
    if (!u_MvpMatrix)
    {
        console.log("Get Uniform[u_MvpMatrix] failed!");
        return false;
    }

    let projMatrix = new Matrix4();
    let viewMatrix = new Matrix4();
    let modelMatrix = new Matrix4();
    
    let rotation = {};
    rotation.xr = 0;
    rotation.yr = 0;
    projMatrix.setPerspective(40, 1, 1, 200);
    viewMatrix.setLookAt(5, 5, 5, 0, 0, 0, 0, 1, 0);
    modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0).scale(1.2, 1.2, 1.2);
    let mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    let u_ModelMatrix = gl.getUniformLocation(program, "u_ModelMatrix");
    if (!u_ModelMatrix)
    {
        console.log("Get Uniform[u_ModelMatrix] failed!");
        return false;
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    let u_NormalMatrix = gl.getUniformLocation(program, "u_NormalMatrix");
    if (!u_NormalMatrix)
    {
        console.log("Get Uniform[u_NormalMatrix] failed!");
        return false;
    }
    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

    function draw(ev, rotation)
    {
        console.log("keyCode: " + ev.keyCode);

        if (ev.keyCode == 39) // ->
        {
            rotation.yr += 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 37) // <-
        {
            rotation.yr -= 1;
            rotation.yr %= 360;
        }
        else if (ev.keyCode == 38) // ^
        {
            rotation.xr -= 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 40)  // v
        {
            rotation.xr += 1;
            rotation.xr %= 360;
        }
        else if (ev.keyCode == 32)  // space
        {
            rotation.xr = 0;
            rotation.yr = 0;
        }
        else
        {
            return;
        }

        modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0).scale(1.2, 1.2, 1.2);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0); 
    }

    document.onkeydown = function (ev) { draw(ev, rotation); };
}

function createArrayBufferAndBindData(gl, data, dataName, n)
{
    let dataBuffer = gl.createBuffer();
    if (!dataBuffer)
    {
        console.log("Create Buffer for " + dataName + " failed!");
        return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    let dataLocation = gl.getAttribLocation(gl["currentProgram"], dataName);
    if (dataLocation < 0)
    {
        console.log("Get Vertex Attribute[" + dataName + "] failed!");
        return false;
    }
    gl.vertexAttribPointer(dataLocation, n, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(dataLocation);

    return true;
}

function createElementArrayBufferAndBindData(gl, data, dataName)
{
    let dataBuffer = gl.createBuffer();
    if (!dataBuffer)
    {
        console.log("Create Buffer for " + dataName + " failed!");
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return true;
}

function getUniform(gl, uniformName)
{
    let uniform = gl.getUniformLocation(gl["currentProgram"], uniformName)
    if (!uniform)
    {
        console.log("Get Uniform[" + uniformName + "] failed!");
        return null;
    }
    return uniform;
}

function render5(gl)
{
    const vertexShaderSource = 
        "attribute vec4 a_Position;\n" + 
        "attribute vec2 a_TexCoord;\n" + 
        "attribute vec3 a_Normal;\n" + 
        "varying vec3 v_Position;\n" + 
        "varying vec2 v_TexCoord;\n" + 
        "varying vec3 v_Normal;\n" + 
        "uniform mat4 u_MvpMatrix;\n" +
        "uniform mat4 u_ModelMatrix;\n" +  
        "uniform mat4 u_NormalMatrix;\n" + 
        "void main() {\n" + 
        "  gl_Position = u_MvpMatrix * a_Position;\n" + 
        "  v_Position = (u_ModelMatrix * a_Position).xyz;\n" + 
        "  v_TexCoord = a_TexCoord;\n" + 
        "  v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);\n" + 
        "}";

    const fragmentShaderSource = 
        "#ifdef GL_ES\n" + 
        "precision mediump float;\n" + 
        "#endif\n" + 
        "varying vec3 v_Position;\n" + 
        "varying vec2 v_TexCoord;\n" + 
        "varying vec3 v_Normal;\n" + 
        "uniform sampler2D u_Sampler;\n" + 
        "uniform vec3 u_PointLightColor;\n" + 
        "uniform vec3 u_PointLightPosition;\n" + 
        "uniform vec3 u_AmbientLightColor;\n" + 
        "void main() {\n" + 
        "  vec3 normal = normalize(v_Normal);\n" + 
        "  vec3 lightDir = normalize(u_PointLightPosition - v_Position);\n" + 
        "  float nDotL = max(dot(lightDir, normal), 0.0);\n" + 
        "  vec4 materialColor = texture2D(u_Sampler, v_TexCoord);\n" + 
        "  vec3 diffuse = materialColor.rgb * u_PointLightColor * nDotL;\n" + 
        "  vec3 ambient = materialColor.rgb * u_AmbientLightColor;\n" + 
        "  gl_FragColor = vec4(diffuse + ambient, materialColor.a);\n" + 
        "}";

    let program = createRenderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program)
        return false;

    gl["currentProgram"] = program;
    gl.useProgram(program);

    /*

           4-----------3
           /|        /|
          / |       / |
        1-----------2 |
         | 8|------|---7
         | /       | /
         |/        |/
        5-----------6

        -1, 1, 1,  // 1 
        1, 1, 1,   // 2
        1, 1, -1,  // 3
        -1, 1, -1, // 4
        -1, -1, 1, // 5
        1, -1, 1,  // 6
        1, -1, -1, // 7
        -1, -1, -1,// 8
    */
    const postionData = new Float32Array([
        -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,      // top  1->2->3->4
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,  // bottom 8->7->6->5
        -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1,  // left 5->1->4->8
        1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,      // right 2->6->6->3
        1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,      // front 2->1->5->6
        -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,  // back 4->3->7->8
    ]);
    
    const texCoordData = new Float32Array([
        0, 0, 1, 0, 1, 1, 0, 1, // top
        0, 0, 1, 0, 1, 1, 0, 1, // bottom
        0, 0, 1, 0, 1, 1, 0, 1, // left
        0, 0, 1, 0, 1, 1, 0, 1, // right
        0, 0, 1, 0, 1, 1, 0, 1, // front
        0, 0, 1, 0, 1, 1, 0, 1, // back
    ]);
    
    const normalData = new Float32Array([
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,       // top
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,   // bottom
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,   // left
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,       // right
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,       // front
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,   // back
    ]);

    const indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,           // top
        4, 5, 6, 4, 6, 7,           // bottom
        8, 9, 10, 8, 10, 11,        // left
        12, 13, 14, 12, 14, 15,     // right
        16, 17, 18, 16, 18, 19,     // front
        20, 21, 22, 20, 22, 23,     // back
    ]);

    if (!createArrayBufferAndBindData(gl, postionData, "a_Position", 3))
        return false;

    if (!createArrayBufferAndBindData(gl, texCoordData, "a_TexCoord", 2))
        return false;

    if (!createArrayBufferAndBindData(gl, normalData, "a_Normal", 3))
        return false;

    if (!createElementArrayBufferAndBindData(gl, indices, ""))
        return false;

    let u_Sampler = getUniform(gl, "u_Sampler");
    if (!u_Sampler)
        return false;
    
    let u_MvpMatrix = getUniform(gl, "u_MvpMatrix");
    if (!u_MvpMatrix)
        return false;

    let u_ModelMatrix = getUniform(gl, "u_ModelMatrix");
    if (!u_ModelMatrix)
        return false;

    let u_NormalMatrix = getUniform(gl, "u_NormalMatrix");
    if (!u_NormalMatrix)
        return false;

    let u_PointLightColor = getUniform(gl, "u_PointLightColor");
    if (!u_PointLightColor)
        return false;
    
    const pointLightColor = new Float32Array([ 1, 1, 1 ]);
    gl.uniform3fv(u_PointLightColor, pointLightColor);

    let u_PointLightPosition = getUniform(gl, "u_PointLightPosition");
    if (!u_PointLightPosition)
        return false;

    const pointLightPosition = new Float32Array([ 0, 0, 5 ]);
    gl.uniform3fv(u_PointLightPosition, pointLightPosition);

    let u_AmbientLightColor = getUniform(gl, "u_AmbientLightColor");
    if (!u_AmbientLightColor)
        return false;

    const ambientLightColor = new Float32Array([ 0.2, 0.2, 0.2 ]);
    gl.uniform3fv(u_AmbientLightColor, ambientLightColor);

    let texture = gl.createTexture();
    if (!texture)
    {
        console.log("Create Texture failed!");
        return false;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let image = new Image();
    image.onload = function ()
    {
        console.log("load image success!");
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        
        gl.uniform1i(u_Sampler, 0);

        let projMatrix = new Matrix4();
        let viewMatrix = new Matrix4();
        let modelMatrix = new Matrix4();
        let mvpMatrix = new Matrix4();
        let normalMatrix = new Matrix4();

        let rotation = {};
        rotation.xr = 0;
        rotation.yr = 0;
        projMatrix.setPerspective(30, 1, 0.1, 150);
        viewMatrix.setLookAt(5, 5, 5, 0, 0, 0, 0, 1, 0);
        modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0).scale(1.2, 1.2, 1.2);

        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);

        function draw(ev)
        {
            console.log("keyCode: " + ev.keyCode);

            if (ev.keyCode == 39) // ->
            {
                rotation.yr += 1;
                rotation.yr %= 360;
            }
            else if (ev.keyCode == 37) // <-
            {
                rotation.yr -= 1;
                rotation.yr %= 360;
            }
            else if (ev.keyCode == 38) // ^
            {
                rotation.xr -= 1;
                rotation.xr %= 360;
            }
            else if (ev.keyCode == 40)  // v
            {
                rotation.xr += 1;
                rotation.xr %= 360;
            }
            else if (ev.keyCode == 32)  // space
            {
                rotation.xr = 0;
                rotation.yr = 0;
            }
            else
            {
                return;
            }

            modelMatrix.setRotate(rotation.yr, 0, 1, 0).rotate(rotation.xr, 1, 0, 0).scale(1.2, 1.2, 1.2);

            mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
            normalMatrix.setInverseOf(modelMatrix);
            normalMatrix.transpose();
    
            gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
            gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
            gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
        }

        document.onkeydown = function(ev) { draw(ev); };
    };
    image.src = "./examples/resources/blueflower.jpg";

    return true;
}

function main()
{
    let gl = createWebGLWithId("example");
    if (!gl)
        return false;

    //render(gl);
    //render2(gl);
    //render3(gl);
    //render4(gl);
    render5(gl);
}