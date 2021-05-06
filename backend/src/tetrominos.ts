export const TETROMINOS: any = {
    0: {
        shape: [[0]], color: '0, 0, 0'
    },

    I: {
        shape: [
            [0, 'I', 0, 0],
            [0, 'I', 0, 0],
            [0, 'I', 0, 0],
            [0, 'I', 0, 0]
        ],
        color: '80, 227, 230',
    },

    J: {
        shape: [
            [0, 'J', 0],
            [0, 'J', 0],
            ['J', 'J', 0],
        ],
        color: '36, 95, 223',
    },

    L: {
        shape: [
            [0, 'L', 0],
            [0, 'L', 0],
            [0, 'L', 'L'],
        ],
        color: '223, 173, 36',
    },

    O: {
        shape: [
            ['O', 'O'],
            ['O', 'O'],
        ],
        color: '223, 217, 36',
    },

    S: {
        shape: [
            [0, 'S', 'S'],
            ['S', 'S', 0],
            [0, 0, 0]
        ],
        color: '48, 211, 56',
    },

    T: {
        shape: [
            [0, 0, 0],
            ['T', 'T', 'T'],
            [0, 'T', 0]
        ],
        color: '132, 61, 198',
    },

    Z: {
        shape: [
            ['Z', 'Z', 0],
            [0, 'Z', 'Z'],
            [0, 0, 0]
        ],
        color: '227, 78, 78',
    },

    X: {
        shape: [
            ['X', 0, 'X'],
            [0, 'X', 0],
            ['X', 0, 'X']
        ],
        color: '255, 0, 0',
    },

}

const getRandomtetro = () => {
    const tetrominos = 'IJLOSTZ';
    return tetrominos[Math.floor(Math.random() * tetrominos.length)]
}

export const randomTetrominoArray = () => {
    const tetroarray = new Array(1000)
    // const randTetromino = 
    //     tetrominos[Math.floor(Math.random() * tetrominos.length)];
    for (var i = 0; i < 1000; i++)
    {
        tetroarray[i] = TETROMINOS[getRandomtetro()]
    }
    return tetroarray
}