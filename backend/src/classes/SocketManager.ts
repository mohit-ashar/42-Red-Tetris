import { randomTetrominoArray } from '../tetrominos';
const { Rooms } = require('../Rooms');
const Room = require('./Room');
const Player = require('./Player');
const _helper = require('../gameHelper');
const { PLAYER_STATUS } = _helper;

class SocketManager {
  io: any;
  socket: any;
  id: string;
  roomName: string;

  constructor(io: any, socket: any) {
    this.io = io;
    this.socket = socket;
    this.id = socket.client.id;
    this.roomName = '';

    socket.on('disconnect', () => {
      console.log(`"${socket.id}" disconnected`);
    });
  }
  on(): void {
    this._createOrJoin();
    this._stage();
    this._getTetros();
    this._onDisconnecting();
    this._onPenalty();
    this._onReady();
    this._onGameOver();
  }

  emit(event: string, data: any): void {
    this.io.to(this.roomName).emit(event, data);
  }

  emitSelf(event: string, data: any): void {
    this.io.to(this.socket.id).emit(event, data);
  }

  _createOrJoin(): void {
    this.socket.on('createOrJoin', (data: any) => {
      const { roomName, userName } = data;
      if (Rooms.has(roomName)) {
        var room = Rooms.get(roomName);
        console.log('Room: ', room);
        if (room.isStarted) {
          this.emitSelf('Error', 'Game has already started');
          return;
        }
        this.roomName = roomName;
        if (room.players.size >= 3) {
          console.log('LIMIT!');
          this.emitSelf('Error', 'Room is Full.');
          return;
        }
        if (room.findPlayerByName(userName)) {
          // get player by userName need to make this.
          console.log('DUPLICATE USERNAME!');
          this.emitSelf('Error', 'Username is already taken');
          return;
        }
        var _newPlayer = new Player(this.id, userName);
        room.addPlayer(_newPlayer);
        this.socket.join(roomName);
        let playerArray: object[] = [];
        for (let value of room.players.values()) {
          playerArray.push({
            playerName: value.name,
            isOwner: room.owner === value.id ? true : false,
          });
        }
        this.emitSelf('Valid', 'Starting game'); //welcome component
        this.emit('Game', playerArray); // tetris component
      } else {
        var _newRoom = new Room(roomName);
        var _newPlayer = new Player(this.id, userName);
        _newRoom.addPlayer(_newPlayer);
        // _newRoom.players.set(userName, _newPlayer);
        _newRoom.owner = _newPlayer.id;
        this.socket.join(roomName);
        this.roomName = roomName;
        Rooms.set(roomName, _newRoom);
        let playerArray: object[] = [];
        playerArray.push({
          playerName: _newPlayer.name,
          isOwner: true,
        });
        this.emitSelf('Valid', 'Starting game'); // welcome component
        this.emitSelf('Game', playerArray); // tetris component
        this.emit('Game', playerArray); // tetris component
      }
    });
  }

  _stage(): void {
    this.socket.on('stage', (stage: any) => {
      this.socket.broadcast.emit('OpponentStage', stage);
    });
  }

  _getTetros(): void {
    this.socket.on('getTetros', () => {
      console.log('GET TETROS  CALLED');
      var room = Rooms.get(this.roomName);
      room.gameStarted();
      room.isStarted = true;
      this.emit('tetroArray', randomTetrominoArray());
    });
  }

  _onDisconnecting(): void {
    this.socket.on('disconnecting', () => {
      this._quit();
    });
  }

  _quit(): void {
    console.log('Room Name: ', Rooms.get(this.roomName));
    console.log(`"${this.socket.id}" disconnected`);

    var room = Rooms.get(this.roomName);
    if (!room) return;

    room.removePlayerById(this.id);
    this.socket.leave(this.roomName);

    if (room.players.size === 0) {
      Rooms.delete(room);
      return;
    }

    // if (room.isStarted && room.players.size === 1) {
    // } else if (room.isStarted && room.players.size > 1) {
    // }
    if (room.isStarted && room.players.size === 1) {
      room.owner = room.players.keys().next().value;
      let playerArray: object[] = [];
      for (let value of room.players.values()) {
        playerArray.push({
          playerName: value.name,
          isOwner: room.owner === value.id ? true : false,
        });
      }
      if (room.isGameOver()) {
        room.isStarted = false;
        this.emit('Over', room.getWinnerName());
      }
      this.emit('Game', playerArray); //tetris component
    } else if (room.isStarted && room.players.size > 1) {
      room.owner = room.players.keys().next().value;
      let playerArray: object[] = [];
      for (let value of room.players.values()) {
        playerArray.push({
          playerName: value.name,
          isOwner: room.owner === value.id ? true : false,
        });
      }
      this.emit('Game', playerArray); //tetris component
    }

    if (!room.isStarted && room.owner === this.id) {
      room.owner = room.players.keys().next().value;
      let playerArray: object[] = [];
      for (let value of room.players.values()) {
        playerArray.push({
          playerName: value.name,
          isOwner: room.owner === value.id ? true : false,
        });
      }
      this.emit('Game', playerArray); //tetris component
    }
    if (!room.isStarted && room.owner !== this.id) {
      let playerArray: object[] = [];
      for (let value of room.players.values()) {
        playerArray.push({
          playerName: value.name,
          isOwner: room.owner === value.id ? true : false,
        });
      }
      this.emit('Game', playerArray); //tetris component
    }
  }

  _onPenalty(): void {
    this.socket.on('penalty', (rows: number) => {
      console.log('rows cleared: ', rows);
      console.log(Rooms.get(this.roomName).players.size, 'is size');
      console.log(Rooms.get(this.roomName).players.length, 'is len');
      if (Rooms.get(this.roomName).players.size > 1) {
        console.log('addPenalty sent');
        this.socket.broadcast.emit('addPenalty', rows);
      }
    });
  }

  _onReady(): void {
    this.socket.on('ready', (playerName: string) => {
      // console.log('ready: ', playerName);
      var room = Rooms.get(this.roomName);
      if (!room) return;
      let _player = room.findPlayerByName(playerName);
      _player.updatePlayerStatus(PLAYER_STATUS.READY);
      this.emit('OpponentReady', playerName);
      if (room.allPlayersReady()) {
        console.log('can start');
        this.emit('CanStart', '');
      }
    });
  }

  _onGameOver(): void {
    this.socket.on('GameOver', (playerName: string) => {
      var room = Rooms.get(this.roomName);
      if (!room) return;
      let _player = room.findPlayerById(this.id);
      _player.updatePlayerStatus(PLAYER_STATUS.GAMEOVER);

      if (room.isGameOver()) {
        room.isStarted = false;
        console.log(
          'winner name: ',
          room.findPlayerByName(room.getWinnerName())
        );
        if (room.findPlayerByName(room.getWinnerName()))
          room.owner = room.findPlayerByName(room.getWinnerName()).id;
        this.emit('Over', room.getWinnerName());
        let playerArray: object[] = [];
        for (let value of room.players.values()) {
          playerArray.push({
            playerName: value.name,
            isOwner: room.owner === value.id ? true : false,
          });
        }
        this.emit('Game', playerArray); //tetris component
      }
      /**
       * Case I. one player's status is not game over: GAME IS OVER
       *  a. Change losing player status to GameOver
       *  b. Change room winner to winning player
       *  c. Emit game over event to the frontend
       *
       * Case II. two player's status is not game over:
       *  a. change losing player status to GameOver
       */
    });
  }
}

module.exports = SocketManager;
