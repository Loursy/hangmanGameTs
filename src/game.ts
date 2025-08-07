import { statusEnum } from './statusEnum';
import { difficultyEnum } from './difficultyEnum';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { terminal } from 'terminal-kit';
const term = terminal;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let hearth: number = 1
let difficulty: number = 0
let randomWord: string
type leader = {
    name: string;
    point: number;
}
let leaderBoard: leader[] = []
let point: number = 0
let x = 0
let i = 0
let guessedLetters: string[] = []
const fp = path.join(__dirname, '..', 'data', 'leaderBoard.json');

function menu(): void {
    console.log("\n<---------WELCOME TO THE HANGMAN GAME--------->")
    console.log("1. NEW GAME")
    console.log("2. LEADERBOARD")
    console.log("3. QUIT")
    console.log("<--------------------------------------------->")

    rl.question("Select an option: ", (answer: string) => {
        switch (Number(answer)) {
            case statusEnum.GAME:
                game()
                break;

            case statusEnum.LEADERBOARD:
                console.log("Leaderboard seçildi.")
               
                const board = fs.readFileSync(fp, 'utf8');

                if (board.trim() === "") {
                    console.log("Leaderboard is empty.");
                    menu();
                } else {
                    leaderBoard = JSON.parse(board) as leader[]
                    console.log("<--------------------------------------------->")
                    leaderBoard.forEach((player, index) => {
                        const name: string = player.name
                        const score: string = String(player.point);
                        console.log(`${index + 1}. ${name} | ${score} points`);
                    })
                    rl.question("Press 'm' for menu or 'q' for quit: ", (key: string) => {
                        const choice = key.toLowerCase();
                        if (choice === "m") {
                            menu();
                        } else if (choice === "q") {
                            console.log("Closing...")
                            rl.close();
                        } else {
                            console.log("Invalid input. Returning to menu...");
                            menu();
                        }
                    })
                }
                break;
            case statusEnum.QUIT:
                console.log("Closing...")
                rl.close();
                break;
            default:
                console.log("Invalid input, please select a valid ıotion")
                menu();
        }
    }
    )
}

function game(): void {
    x = 0;
    i = 0;
    console.log("<--------------------------------------------->")
    console.log("1. EASY")
    console.log("2. MEDIUM")
    console.log("3. HARD")
    rl.question("Select difficulty: ", (number: string) => {
        const numAnswer = Number(number)
        switch (numAnswer) {
            case difficultyEnum.EASY:
                console.log("Easy mode selected.")
                difficulty = difficultyEnum.EASY;
                hearth = 5
                createWord()
                gameloop()
                break;
            case difficultyEnum.MEDIUM:
                console.log("Medium mode selected.")
                difficulty = difficultyEnum.MEDIUM;
                hearth = 4
                createWord()
                gameloop()
                break;
            case difficultyEnum.HARD:
                console.log("Hard mode selected.")
                difficulty = difficultyEnum.HARD
                hearth = 3
                createWord()
                gameloop()
                break;
            default:
                console.log("Invalid difficulty please select valid difficulty");
                game();
        }
    })
}

function createWord(): string {
    let filePath: string = path.join(__dirname, '..', 'src', 'data', 'leaderBoard.json');

    switch (difficulty) {
        case difficultyEnum.EASY:
            filePath = 'data/easy.txt';
            break;
        case difficultyEnum.MEDIUM:
            filePath = 'data/medium.txt';
            break;
        case difficultyEnum.HARD:
            filePath = 'data/hard.txt';
            break;
    }

    const data = fs.readFileSync(filePath, 'utf-8')
    const arr: string[] = data.split('\n');
    const randomIndex: number = Math.floor(Math.random() * arr.length);
    randomWord = arr[randomIndex];
    return randomWord
}

function maskWord(randomWord: string, guessedLetters: string[]): string {
    let masked = '';
    for (let i = 0; i < randomWord.length; i++) {
        if (guessedLetters.includes(randomWord[i])) {
            masked += randomWord[i] + ' '
        } else {
            masked += '_ ';
        }
    }
    return masked.trim()
}

function gameloop(): void {
    guessedLetters = []
    askGuess();
}

function askGuess(): void {
    console.log("<--------------------------------------------->")
    console.log(`Lives left: ${hearthAnimation(hearth)}`)
    console.log(`Guessed letters: ${guessedLetters.join(", ")}`)
    console.log(`Word: ${maskWord(randomWord, guessedLetters)}`)

    rl.question("Guess a letter: ", (letter: string) => {
        letter = letter.toLowerCase();

        if (letter.length !== 1 || !/[a-z]/.test(letter)) {
            console.log("Please enter a single valid letter.");
            askGuess();
            return;
        }

        if (guessedLetters.includes(letter)) {
            console.log("You already guessed that letter.");
            askGuess();
            return;
        }

        guessedLetters.push(letter);

        if (randomWord.includes(letter)) {
            console.log("Correct!");
            const masked = maskWord(randomWord, guessedLetters);
            if (!masked.includes('_')) {
                danceAnimation();
            } else {
                askGuess();
            }
        } else {
            hearth--;
            console.log("Wrong!");

            if (hearth <= 0) {
                animateHangman();
            } else {
                askGuess();
            }
        }
    });
}
function calculatePoints(callback: () => void) {
    switch (difficulty) {
        case difficultyEnum.EASY:
            point = randomWord.length * hearth * 30
            break;
        case difficultyEnum.MEDIUM:
            point = randomWord.length * hearth * 100
            break;
        case difficultyEnum.HARD:
            point = randomWord.length * hearth * 250
            break;
    }

    console.log(`Point: ${point}`)
    leaderBoardWriter(callback);
}

function leaderBoardWriter(callback: () => void) {
    let existingData: leader[] = [];
    const fileContent = fs.readFileSync(fp, 'utf8')
    if (fileContent.trim()) {
        existingData = JSON.parse(fileContent) as leader[];
    }

    rl.question("Write your name: ", (playerName: string) => {
        existingData.push({ name: playerName, point: point });
        for (let i = 0; i < existingData.length; i++) {
            for (let j = i + 1; j < existingData.length; j++) {
                if (existingData[j].point > existingData[i].point) {
                    let temp = existingData[i];
                    existingData[i] = existingData[j];
                    existingData[j] = temp;
                }
            }
        }
        fs.writeFileSync(fp, JSON.stringify(existingData, null, 2));
        callback();
    })
}
const frames = [
    `
     +---+
         |
         |
         |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
         |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
     |   |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|   |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|\\  |
         |
         |
    =========`,
    `
     +---+
     |   |
     O   |
    /|\\  |
    /    |
         |
    =========`,
    `
     +---+
     |   |
    💀   |
    /|\\  |
    / \\  |
         |
    =========`
];
const animateHangman = () => {
    if (i < frames.length) {
        term.clear();
        term.eraseDisplay();
        term.red(frames[i]);
        i++;
        setTimeout(animateHangman, 500);
    } else {
        term.bold.red("\n💀 GAME OVER\n");
        term.green(`The word was: ${randomWord}`);
        menu();
    }
};

const danceFrames = [
    `
     \\😜/
      |
     / \\`,
    `
      😜
     /|\\
     / \\`,
    `
     \\😜
      |\\
     / \\`,
    `
     \\😜/
      |
     / \\`,
    `
      😜
     /|\\
     / \\`,
    `
     \\😜
      |\\
     / \\`
];
function danceAnimation() {
    if (x < danceFrames.length) {
        term.clear();
        term.eraseDisplay();
        term.red(danceFrames[x]);
        x++;
        setTimeout(danceAnimation, 500);
    } else {
        term.clear();
        term.yellow('\n🎉 YOU WON! 🕺💃');
        term.green(`\nThe word was: ${randomWord} \n`);
        calculatePoints(menu);
    }
}

function hearthAnimation(hearth: number): string {
    const heart = '❤️ ';
    return heart.repeat(Number(hearth));
}

menu()