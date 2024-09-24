export async function readObjFile(filePath) {
    const response = await fetch(filePath);
    const data = await response.text();

    const vertices = [];
    const quadFaces = [];
    const triangleFaces = [];
    const sequentialVertices = [];

    const objFile = data.split('\n');
    getData(objFile);
    convertQuadToTriangleFaces();
    getSequentialVertices();

    return sequentialVertices;

    function getData(objFile) {
        objFile.forEach((element) => {
            element = element.trim();

            if (element.startsWith('v ')) {
                const vertex = element.split(' ').slice(1).map(parseFloat);
                vertices.push(vertex);
            } else if (element.startsWith('f ')) {
                const face = element.split(' ').slice(1).map((index) => {
                    return index.split('/')[0];
                });
                quadFaces.push(face);
            }
        });
    }

    function convertQuadToTriangleFaces() {
        if (quadFaces.length === 0) return;

        for (let face of quadFaces) {
            if (face.length === 4) {
                triangleFaces.push([face[0], face[1], face[3]]);
                triangleFaces.push([face[3], face[2], face[0]]);
            } else {
                triangleFaces.push(face);
            }
        }
    }

    function getSequentialVertices() {
        if (triangleFaces.length === 0) return;

        triangleFaces.forEach((face) => {
            vertices[face[0] - 1].forEach((coordinate) => { sequentialVertices.push(coordinate); });
            vertices[face[1] - 1].forEach((coordinate) => { sequentialVertices.push(coordinate); });
            vertices[face[2] - 1].forEach((coordinate) => { sequentialVertices.push(coordinate); });
        });
    }
}
