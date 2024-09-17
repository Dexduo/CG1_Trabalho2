var InitDemo = function(){
    console.log('This is working');

    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext('webgl');

    if(!gl){
        console.log('WebGL not supported, falling back to experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }

    if(!gl){
        alert('Your browser does not support WebGL');
    }

}