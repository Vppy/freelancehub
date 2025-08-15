const readline = require('readline-sync');

const number = readline.questionInt('Enter a number: ');

(number % 2 === 0) ? console.log(`${number} is even`) : console.log(`${number} is odd`);

(number % 3 === 0) ? console.log(`${number} is divisible by 3`) : (number % 4 === 0) ? console.log(`${number} is divisible by 4`) : console.log(`${number} is not divisible by 3 or 4`);

const firnname = readline.question('Enter your first name: ');
const nickname = readline.question('Enter your nickname: ');

console.log(length(firstname) > 0 ? `hello ${firstname}` : `hello ${nickname}`);