import React, { useState, useCallback } from 'react';
import './App.css';

// Simulazione di una libreria di scacchi semplificata
class ChessGame {
  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'white';
    this.selectedSquare = null;
    this.gameStatus = 'playing';
    this.enPassantTarget = null;
    this.hasMoved = {
      whiteKing: false,
      blackKing: false,
      whiteRookLeft: false,
      whiteRookRight: false,
      blackRookLeft: false,
      blackRookRight: false,
    };
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

  isKingInCheck(color) {
    let kingRow = -1, kingCol = -1;

    // Trova il re
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          kingRow = row;
          kingCol = col;
        }
      }
    }

    // Controlla se qualche pezzo avversario può colpire il re
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color !== color) {
          if (this.isValidMove(row, col, kingRow, kingCol)) {
            return { row: kingRow, col: kingCol }; // 🔴 Re sotto scacco
          }
        }
      }
    }

    return null; // ✅ Nessuno scacco
  }

  isCheckmate(color) {
    if (!this.isKingInCheck(color)) return false;

    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== color) continue;

        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            const copyGame = new ChessGame();
            copyGame.board = this.board.map(row => row.map(cell => cell ? { ...cell } : null));
            copyGame.currentPlayer = color;
            copyGame.enPassantTarget = this.enPassantTarget
              ? { ...this.enPassantTarget }
              : null;

            if (copyGame.isValidMove(fromRow, fromCol, toRow, toCol)) {
              // Prova la mossa
              copyGame.board[toRow][toCol] = copyGame.board[fromRow][fromCol];
              copyGame.board[fromRow][fromCol] = null;

              if (!copyGame.isKingInCheck(color)) {
                return false; // ha almeno una mossa per salvarsi
              }
            }
          }
        }
      }
    }

    return true; // nessuna mossa lo salva: è scacco matto
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
    if (!piece) return false;
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

    const targetPiece = this.board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) return false;

    if (piece.type == 'pawn') {
      let direction = piece.color == 'white' ? -1 : 1;
      let pawnStartRow = piece.color == 'white' ? 6 : 1;

      //mossa standard
      if (toCol == fromCol && toRow - fromRow == direction && !targetPiece) return true;

      //mossa iniziale da 2
      if (toCol == fromCol && fromRow == pawnStartRow && toRow - fromRow == 2 * direction &&
        this.board[toRow - direction][toCol] == null && !targetPiece) return true;

      //cattura in diagonale normale
      if (Math.abs(toCol - fromCol) == 1 && toRow - fromRow == direction && targetPiece) return true;

      // EN PASSANT CORRETTO
      if (Math.abs(toCol - fromCol) === 1 &&
        toRow - fromRow === direction &&
        !targetPiece &&
        this.enPassantTarget &&
        toRow === this.enPassantTarget.row &&
        toCol === this.enPassantTarget.col) {
        return true;
      }
    }

    if (piece.type == 'rook') {
      if ((toCol == fromCol || fromRow == toRow) && this.isPathClear(fromRow, fromCol, toRow, toCol)) return true;
    }
    if (piece.type == 'knight') {
      if ((Math.abs(toCol - fromCol) == 2 && Math.abs(toRow - fromRow) == 1) ||
        Math.abs(toCol - fromCol) == 1 && Math.abs(toRow - fromRow) == 2) return true;
    }
    if (piece.type == 'bishop') {
      if ((Math.abs(toCol - fromCol) == Math.abs(toRow - fromRow)) && this.isPathClear(fromRow, fromCol, toRow, toCol)) return true;
    }
    if (piece.type == 'queen') {
      if (((toCol == fromCol || fromRow == toRow) || Math.abs(toCol - fromCol) == Math.abs(toRow - fromRow))
        && this.isPathClear(fromRow, fromCol, toRow, toCol)) return true;
    }
    if (piece.type == 'king') {
      if (Math.abs(toCol - fromCol) <= 1 && Math.abs(toRow - fromRow) <= 1) return true;
      //arrocco
      if (toRow == fromRow && Math.abs(toCol - fromCol) == 2) {
        const isWhite = piece.color === 'white';
        const row = isWhite ? 7 : 0;

        const kingSide = toCol > fromCol;
        const rookCol = kingSide ? 7 : 0;
        const betweenCols = kingSide ? [5, 6] : [1, 2, 3];

        // Controllo se re o torre si sono già mossi
        const kingMoved = this.hasMoved[isWhite ? 'whiteKing' : 'blackKing'];
        const rookMoved = this.hasMoved[isWhite
          ? kingSide ? 'whiteRookRight' : 'whiteRookLeft'
          : kingSide ? 'blackRookRight' : 'blackRookLeft'];

        if (kingMoved || rookMoved) return false;

        // Controlla se il percorso è libero
        for (let col of betweenCols) {
          if (this.board[row][col] !== null) return false;
        }

        // Controlla che il re non sia sotto scacco né attraversi caselle attaccate
        const directions = kingSide ? [4, 5, 6] : [4, 3, 2];
        for (let col of directions) {
          const tempGame = new ChessGame();
          tempGame.board = this.board.map(r => r.map(cell => (cell ? { ...cell } : null)));
          tempGame.board[row][col] = { ...piece };
          tempGame.board[fromRow][fromCol] = null;
          tempGame.enPassantTarget = this.enPassantTarget
            ? { ...this.enPassantTarget }
            : null;

          if (tempGame.isKingInCheck(piece.color)) return false;
        }

        return true;
      }
    }

    return false;
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) return false;

    const piece = this.board[fromRow][fromCol];
    if (piece.color != this.currentPlayer) return false;

    const isCastling = piece.type === 'king' && Math.abs(toCol - fromCol) === 2;

    if (isCastling) {
      const isWhite = piece.color === 'white';
      const row = isWhite ? 7 : 0;
      const kingSide = toCol > fromCol;

      // Sposta il re
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;

      // Sposta la torre
      const rookFromCol = kingSide ? 7 : 0;
      const rookToCol = kingSide ? 5 : 3;
      this.board[row][rookToCol] = this.board[row][rookFromCol];
      this.board[row][rookFromCol] = null;

      // Aggiorna hasMoved
      this.hasMoved[isWhite ? 'whiteKing' : 'blackKing'] = true;
      this.hasMoved[isWhite
        ? kingSide ? 'whiteRookRight' : 'whiteRookLeft'
        : kingSide ? 'blackRookRight' : 'blackRookLeft'] = true;

      this.currentPlayer = isWhite ? 'black' : 'white';
      this.enPassantTarget = null; // Reset en passant dopo qualsiasi mossa
      return true;
    }

    // CONTROLLO EN PASSANT CORRETTO
    const isEnPassant = piece.type === 'pawn' &&
      Math.abs(toCol - fromCol) === 1 &&
      this.board[toRow][toCol] === null &&
      this.enPassantTarget &&
      toRow === this.enPassantTarget.row &&
      toCol === this.enPassantTarget.col;

    // Salva il pezzo catturato prima di fare la mossa
    let captured = null;
    let capturedPawnRow = -1;
    let capturedPawnCol = -1;

    if (isEnPassant) {
      // Per en passant, il pedone da catturare è sulla stessa riga del pedone che si muove
      capturedPawnRow = fromRow;
      capturedPawnCol = toCol;
      captured = this.board[capturedPawnRow][capturedPawnCol];
    } else {
      captured = this.board[toRow][toCol];
    }

    // Esegui la mossa
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;

    // Se è en passant, rimuovi il pedone catturato
    if (isEnPassant) {
      this.board[capturedPawnRow][capturedPawnCol] = null;
    }

    // Verifica se il re è in scacco dopo la mossa
    const isCheck = this.isKingInCheck(piece.color);

    // Se il re è in scacco, annulla la mossa
    if (isCheck) {
      this.board[fromRow][fromCol] = piece;
      if (isEnPassant) {
        this.board[toRow][toCol] = null;
        this.board[capturedPawnRow][capturedPawnCol] = captured;
      } else {
        this.board[toRow][toCol] = captured;
      }
      return false;
    }

    // AGGIORNA EN PASSANT TARGET
    if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      // Un pedone si è mosso di 2 caselle, imposta il target per en passant
      const direction = piece.color === 'white' ? 1 : -1;
      this.enPassantTarget = {
        row: toRow + direction, // La casella dove l'avversario può muoversi per catturare
        col: toCol
      };
    } else {
      this.enPassantTarget = null; // Reset en passant se non è una mossa di pedone da 2
    }

    // Cambia turno
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // Aggiorna hasMoved per arrocco
    if (piece.type === 'king') {
      this.hasMoved[piece.color === 'white' ? 'whiteKing' : 'blackKing'] = true;
    }
    if (piece.type === 'rook') {
      if (fromRow === 7 && fromCol === 0) this.hasMoved.whiteRookLeft = true;
      if (fromRow === 7 && fromCol === 7) this.hasMoved.whiteRookRight = true;
      if (fromRow === 0 && fromCol === 0) this.hasMoved.blackRookLeft = true;
      if (fromRow === 0 && fromCol === 7) this.hasMoved.blackRookRight = true;
    }

    return true;
  }
}

const ChessApp = () => {
  const [game, setGame] = useState(new ChessGame());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [checkedKing, setCheckedKing] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

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

  function getAlgebraicNotation(piece, fromRow, fromCol, toRow, toCol, captured, check, checkmate, isCastling, isEnPassant) {
    if (isCastling) {
      return toCol === 6 ? 'O-O' : 'O-O-O';
    }

    const fromFile = String.fromCharCode(97 + fromCol);
    const toFile = String.fromCharCode(97 + toCol);
    const toRank = 8 - toRow;

    const isCapture = captured || isEnPassant ? 'x' : '';
    const checkSymbol = checkmate ? '#' : check ? '+' : '';

    // Pedone
    if (piece.type === 'pawn') {
      if (isCapture) {
        return `${fromFile}x${toFile}${toRank}${checkSymbol}`;
      } else {
        return `${toFile}${toRank}${checkSymbol}`;
      }
    }

    // Altri pezzi
    return `${getPieceSymbol(piece)}${isCapture}${toFile}${toRank}${checkSymbol}`;
  }

  const handleSquareClick = useCallback((row, col) => {
    if (gameOver) return;

    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare;

      if (fromRow === row && fromCol === col) {
        setSelectedSquare(null);
        return;
      }

      const newGame = new ChessGame();
      newGame.board = game.board.map(row => row.map(cell => cell ? { ...cell } : null));
      newGame.currentPlayer = game.currentPlayer;
      newGame.enPassantTarget = game.enPassantTarget ? { ...game.enPassantTarget } : null;
      newGame.hasMoved = { ...game.hasMoved };

      const movedPiece = game.getPieceAt(fromRow, fromCol);
      const captured = game.getPieceAt(row, col);

      // Controlla se è en passant prima di fare la mossa
      const isEnPassant = movedPiece?.type === 'pawn' &&
        Math.abs(col - fromCol) === 1 &&
        !captured &&
        game.enPassantTarget &&
        row === game.enPassantTarget.row &&
        col === game.enPassantTarget.col;

      if (newGame.makeMove(fromRow, fromCol, row, col)) {
        // Controlla scacco e scacco matto
        const check = newGame.isKingInCheck(newGame.currentPlayer);
        const checkmate = newGame.isCheckmate(newGame.currentPlayer);
        const isCastling = movedPiece.type === 'king' && Math.abs(col - fromCol) === 2;

        const moveNotation = getAlgebraicNotation(
          movedPiece,
          fromRow,
          fromCol,
          row,
          col,
          captured,
          check,
          checkmate,
          isCastling,
          isEnPassant
        );
        setMoveHistory(prev => {
          const newHistory = [...prev];
          if (game.currentPlayer === 'white') {
            newHistory.push({ white: moveNotation, black: '' });
          } else {
            const lastMove = newHistory.pop() || { white: '', black: '' };
            newHistory.push({ ...lastMove, black: moveNotation });
          }
          return newHistory;
        });

        setGame(newGame);
        setCheckedKing(check);

        // Controllo scacco matto
        if (checkmate) {
          setGameOver(true);
          setWinner(game.currentPlayer); // Il giocatore precedente ha vinto
        }
      }



      setSelectedSquare(null);
    } else {
      const piece = game.getPieceAt(row, col);
      if (piece && piece.color === game.currentPlayer) {
        setSelectedSquare([row, col]);
      }
    }
  }, [game, selectedSquare, gameOver]);

  const resetGame = () => {
    setGame(new ChessGame());
    setSelectedSquare(null);
    setCheckedKing(null);
    setMoveHistory([]);
    setGameOver(false);
    setWinner(null);
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
          {gameOver && (
            <div className="game-over">
              ♛ Scacco Matto! Vince il {winner === 'white' ? 'Bianco' : 'Nero'} ♚
            </div>
          )}
          <div className="board-wrapper">
            <div className="chessboard">
              {Array(8).fill(null).map((_, row) =>
                Array(8).fill(null).map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    className={`square ${isSquareDark(row, col) ? 'dark' : 'light'} 
                    ${isSquareSelected(row, col) ? 'selected' : ''} 
                    ${checkedKing && checkedKing.row === row && checkedKing.col === col ? 'check' : ''}`}
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
                      {index + 1}. {move.white || ''} {move.black || ''}
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