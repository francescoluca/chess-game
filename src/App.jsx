import React, { useState, useCallback } from 'react';
import './App.css';

// Simulazione di una libreria di scacchi semplificata
class ChessGame {
  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.selectedSquare = null;
    this.gameStatus = 'playing';
  }

  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Pedoni
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
      board[6][i] = { type: 'pawn', color: 'white' };
    }

    // Pezzi neri
    board[0] = [
      { type: 'rook', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'queen', color: 'black' },
      { type: 'king', color: 'black' },
      { type: 'bishop', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'rook', color: 'black' }
    ];

    // Pezzi bianchi
    board[7] = [
      { type: 'rook', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'queen', color: 'white' },
      { type: 'king', color: 'white' },
      { type: 'bishop', color: 'white' },
      { type: 'knight', color: 'white' },
      { type: 'rook', color: 'white' }
    ];

    return board;
  }

  getPieceAt(row, col) {
    return this.board[row][col];
  }

  isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = Math.sign(toRow - fromRow);
    const colStep = Math.sign(toCol - fromCol);

    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;

    while (currentRow !== toRow || currentCol !== toCol) {
      if (this.board[currentRow][currentCol] != null) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }

    return true;
  }


  isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    if (!piece || piece.color !== this.currentPlayer) return false;
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

    const targetPiece = this.board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) return false;

    if (piece.type == 'pawn') {
      let direction = piece.color == 'white' ? -1 : 1;
      let startRow = piece.color == 'white' ? 6 : 1;
      if (toCol == fromCol && toRow - fromRow == direction && !targetPiece) return true;
      if (toCol == fromCol && fromRow == startRow && toRow - fromRow == 2 * direction &&
        this.board[toRow - direction][toCol] == null && !targetPiece) return true;
      if (Math.abs(toCol - fromCol) == 1 && toRow - fromRow == direction && targetPiece) return true;
    }
    if (piece.type == 'rook') {
      if (toCol == fromCol || fromRow == toRow && this.isPathClear(fromRow, fromCol, toRow, toCol)) return true;
    }
    if (piece.type == 'knight') {
      if ((Math.abs(toCol - fromCol) == 2 && Math.abs(toRow - fromRow) == 1) ||
        Math.abs(toCol - fromCol) == 1 && Math.abs(toRow - fromRow) == 2) return true;
    }
    if (piece.type == 'bishop') {
      if ((Math.abs(toCol - fromCol) == Math.abs(toRow - fromRow)) && this.isPathClear(fromRow, fromCol, toRow, toCol)) return true;
    }
    if (piece.type == 'queen') {
      if ((toCol == fromCol || fromRow == toRow) || Math.abs(toCol - fromCol) == Math.abs(toRow - fromRow)
        && this.isPathClear(fromRow, fromCol, toRow, toCol)) return true;
    }
    if (piece.type == 'king') {
      if (Math.abs(toCol - fromCol) <= 1 && Math.abs(toRow - fromRow) <= 1) return true;
    }

    return false;
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) return false;

    this.board[toRow][toCol] = this.board[fromRow][fromCol];
    this.board[fromRow][fromCol] = null;
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    return true;
  }
}

const ChessApp = () => {
  const [game, setGame] = useState(new ChessGame());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

  const getPieceSymbol = (piece) => {
    if (!piece) return '';

    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };

    return symbols[piece.color][piece.type] || '';
  };

  const handleSquareClick = useCallback((row, col) => {
    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare;

      if (fromRow === row && fromCol === col) {
        setSelectedSquare(null);
        return;
      }

      const newGame = new ChessGame();
      newGame.board = game.board.map(row => [...row]);
      newGame.currentPlayer = game.currentPlayer;

      if (newGame.makeMove(fromRow, fromCol, row, col)) {
        const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + col)}${8 - row}`;
        setMoveHistory(prev => [...prev, moveNotation]);
        setGame(newGame);
      }

      setSelectedSquare(null);
    } else {
      const piece = game.getPieceAt(row, col);
      if (piece && piece.color === game.currentPlayer) {
        setSelectedSquare([row, col]);
      }
    }
  }, [game, selectedSquare]);

  const resetGame = () => {
    setGame(new ChessGame());
    setSelectedSquare(null);
    setMoveHistory([]);
  };

  const isSquareSelected = (row, col) => {
    return selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
  };

  const isSquareDark = (row, col) => {
    return (row + col) % 2 === 1;
  };

  return (
    <div className="app">
      <div className="game-container">

        {/* Scacchiera */}
        <div className="board-section">
          <div className="board-wrapper">
            <div className="chessboard">
              {Array(8).fill(null).map((_, row) =>
                Array(8).fill(null).map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    className={`square ${isSquareDark(row, col) ? 'dark' : 'light'
                      } ${isSquareSelected(row, col) ? 'selected' : ''}`}
                    onClick={() => handleSquareClick(row, col)}
                  >
                    <span className="piece">
                      {getPieceSymbol(game.getPieceAt(row, col))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button onClick={resetGame} className="reset-btn">
            Nuova Partita
          </button>
        </div>

        {/* Pannello informazioni */}
        <div className="info-panel">
          <h1 className="title">♔ Scacchi ♚</h1>

          <div className="current-turn">
            <h2>Turno Corrente</h2>
            <div className="player-indicator">
              <div className={`color-dot ${game.currentPlayer}`}></div>
              <span>{game.currentPlayer === 'white' ? 'Bianco' : 'Nero'}</span>
            </div>
          </div>

          <div className="instructions">
            <h3>Come Giocare</h3>
            <ul>
              <li>• Clicca su un pezzo per selezionarlo</li>
              <li>• Clicca su una casella per muoverlo</li>
              <li>• I turni si alternano automaticamente</li>
              <li>• Usa "Nuova Partita" per ricominciare</li>
            </ul>
          </div>

          <div className="move-history">
            <h3>Storia Mosse ({moveHistory.length})</h3>
            <div className="history-list">
              {moveHistory.length === 0 ? (
                <p className="no-moves">Nessuna mossa ancora</p>
              ) : (
                <div className="moves">
                  {moveHistory.map((move, index) => (
                    <div key={index} className="move">
                      {index + 1}. {move}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessApp;